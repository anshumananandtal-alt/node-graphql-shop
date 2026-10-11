jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn().mockResolvedValue({})
    }))
}))

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config({ quiet: true })

const User = require('../../models/user')
const authResolver = require('../resolver/auth')

describe('Testing Auth', function () {
    let user
    let fixtureEmails

    beforeAll(async function () {
        await mongoose.connect(
            `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@node.3l7dvs8.mongodb.net/test-shop-mongoose`,
            { useNewUrlParser: true, useUnifiedTopology: true }
        )
    })

    afterAll(async function () {
        await mongoose.disconnect()
    })

    beforeEach(async function () {
        fixtureEmails = []
        const email = `auth-test-${new mongoose.Types.ObjectId()}@example.com`
        fixtureEmails.push(email)
        user = await User.create({
            name: 'Auth Test User',
            email,
            password: await bcrypt.hash('correct-password', 4),
            cart: { items: [] }
        })
    })

    afterEach(async function () {
        if (fixtureEmails && fixtureEmails.length) {
            await User.deleteMany({ email: { $in: fixtureEmails } })
        }
    })

    function createRequest() {
        return {
            session: {
                id: 'test-session-id',
                save: jest.fn().mockResolvedValue(undefined),
                destroy: jest.fn(callback => callback())
            }
        }
    }

    describe('Login', function () {
        it('rejects invalid input without querying users', async function () {
            await expect(authResolver.postLogin(
                { email: 'invalid-email', password: '123' },
                createRequest()
            )).rejects.toThrow('Invalid input.')
        })

        it('authenticates a real user and saves the session', async function () {
            const req = createRequest()

            const result = await authResolver.postLogin(
                { email: user.email, password: 'correct-password' },
                req
            )

            expect(result).toEqual({
                token: 'test-session-id',
                userId: user._id.toString()
            })
            expect(req.session.isLoggedIn).toBe(true)
            expect(req.session.user._id.toString()).toBe(user._id.toString())
            expect(req.session.save).toHaveBeenCalled()
        })

        it('rejects a wrong password', async function () {
            await expect(authResolver.postLogin(
                { email: user.email, password: 'wrong-password' },
                createRequest()
            )).rejects.toThrow('Invalid email or password')
        })

        it('rejects an email that is not registered', async function () {
            await expect(authResolver.postLogin(
                { email: 'missing-auth-user@example.com', password: 'correct-password' },
                createRequest()
            )).rejects.toThrow('Invalid email or password')
        })
    })

    describe('Signup', function () {
        it('rejects invalid input without creating a user', async function () {
            const email = `invalid-signup-${new mongoose.Types.ObjectId()}@example.com`

            await expect(authResolver.postSignup(
                { name: '', email, password: '123', confirmPassword: '321' },
                createRequest()
            )).rejects.toThrow('Invalid input.')

            expect(await User.findOne({ email })).toBeNull()
        })

        it('creates a user with a hashed password and starts a session', async function () {
            const email = `signup-${new mongoose.Types.ObjectId()}@example.com`
            fixtureEmails.push(email)
            const req = createRequest()

            const result = await authResolver.postSignup(
                {
                    name: 'New Auth User',
                    email,
                    password: 'signup-password',
                    confirmPassword: 'signup-password'
                },
                req
            )
            const savedUser = await User.findOne({ email })

            expect(result.message).toBe('User created successfully.')
            expect(result.userId).toBe(savedUser._id.toString())
            expect(savedUser.password).not.toBe('signup-password')
            expect(await bcrypt.compare('signup-password', savedUser.password)).toBe(true)
            expect(req.session.isLoggedIn).toBe(true)
            expect(req.session.save).toHaveBeenCalled()
        })

        it('rejects an email that already exists', async function () {
            await expect(authResolver.postSignup(
                {
                    name: 'Duplicate Auth User',
                    email: user.email,
                    password: 'signup-password',
                    confirmPassword: 'signup-password'
                },
                createRequest()
            )).rejects.toThrow('Email address already exists.')
        })
    })

    describe('Logout', function () {
        it('rejects when the session token is missing', async function () {
            await expect(authResolver.postLogout({}, createRequest()))
                .rejects.toThrow('No active session')
        })

        it('destroys an active session', async function () {
            const req = createRequest()

            const result = await authResolver.postLogout({ token: 'test-session-id' }, req)

            expect(result).toEqual({
                message: 'Logout successfully',
                status: 200
            })
            expect(req.session.destroy).toHaveBeenCalled()
        })
    })

    describe('Reset Password', function () {
        it('rejects an invalid email', async function () {
            await expect(authResolver.postResetPassword(
                { email: 'invalid-email' },
                createRequest()
            )).rejects.toThrow('Invalid email')
        })

        it('rejects when the account does not exist', async function () {
            await expect(authResolver.postResetPassword(
                { email: 'missing-reset-user@example.com' },
                createRequest()
            )).rejects.toThrow('User not found')
        })

        it('persists a reset token and expiration for an existing user', async function () {
            const result = await authResolver.postResetPassword(
                { email: user.email },
                createRequest()
            )
            const updatedUser = await User.findById(user._id)

            expect(result).toEqual({
                message: 'Reset Password Link is sent to email',
                status: 200
            })
            expect(updatedUser.resetToken).toMatch(/^[a-f0-9]{64}$/)
            expect(updatedUser.resetTokenExpTime.getTime()).toBeGreaterThan(Date.now())
        })
    })

    describe('New Password', function () {
        it('rejects when the token is missing', async function () {
            await expect(authResolver.postNewPassword(
                { token: '', password: 'new-password' },
                createRequest()
            )).rejects.toThrow('Token is required')
        })

        it('rejects an invalid password', async function () {
            await expect(authResolver.postNewPassword(
                { token: 'some-reset-token', password: '123' },
                createRequest()
            )).rejects.toThrow('Invalid Password')
        })

        it('rejects an expired reset token', async function () {
            user.resetToken = 'expired-reset-token'
            user.resetTokenExpTime = new Date(Date.now() - 1000)
            await user.save()

            await expect(authResolver.postNewPassword(
                { token: user.resetToken, password: 'new-password' },
                createRequest()
            )).rejects.toThrow('Invalid token provided')
        })

        it('persists a new hashed password for a valid reset token', async function () {
            user.resetToken = 'valid-reset-token'
            user.resetTokenExpTime = new Date(Date.now() + 60 * 60 * 1000)
            await user.save()

            const result = await authResolver.postNewPassword(
                { token: user.resetToken, password: 'new-password' },
                createRequest()
            )
            const updatedUser = await User.findById(user._id)

            expect(result).toEqual({
                message: 'Password reset successfully',
                status: 200
            })
            expect(updatedUser.password).not.toBe('new-password')
            expect(await bcrypt.compare('new-password', updatedUser.password)).toBe(true)
        })
    })
})
