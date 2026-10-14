const { PutObjectCommand, DeleteObjectCommand, S3Client} = require('@aws-sdk/client-s3')
const { randomUUID} = require('crypto')
const fs = require('fs')
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const bucket  = process.env.AWS_S3_BUCKET


exports.postImage = async(file)=>{
  const extensionMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };

  const extension = extensionMap[file.mimetype];
  const key  = `images/${randomUUID()}${extension}`
  const result = await s3.send(new PutObjectCommand({
    Key: key,
    Bucket: bucket,
    Body: file.buffer,
    ContentType: file.mimetype
  }))
  return key
}


exports.deleteImage = async(key)=>{
    const deleteResult = await s3.send(new DeleteObjectCommand({
        Key: key,
        Bucket: bucket
    }))
    return deleteResult
}
