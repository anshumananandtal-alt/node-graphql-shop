const path = require('path')
const fs = require('fs')
const rootDir = require('../util/path')
const Order = require('../models/order');
const PdfDocument = require('pdfkit');
const { deleteFile } = require('../util/helper');
const { postImage, deleteImage } = require('../util/awsService')


exports.getInvoice = (req, res, next) =>{
  const orderId = req.params.orderId
  Order.findById(orderId)
  .then(order =>{
    console.log('#order', order)
    if(!order){
      throw new Error('No order found with that orderId')
    }
    if(order.user.userId?.toString() !== req.session.user._id.toString()){
      throw new Error('Access Denied')
    }
    const fileName = `invoice-${orderId}.pdf`
    const filePath = path.join(rootDir, 'data', 'invoices', fileName)

    // fs.readFile(filePath, (err, data)=>{
    //   if(err){
    //     return next(err)
    //   }
    // const file = fs.createReadStream(filePath)
      res.setHeader(
        'Content-Type', 'application/pdf')
    //   // res.setHeader("Content-Disposition", `attachment; filename=${fileName}`)
      res.setHeader("Content-Disposition", `inline; filename=${fileName}`)

    //   return file.pipe(res)
    const pdfDoc = new  PdfDocument()
    pdfDoc.pipe(fs.createWriteStream(filePath))
    pdfDoc.pipe(res)
    pdfDoc.fontSize(20).text(
      `Invoice For Order: ${orderId}`,
      {
        underline: true
      }
    )
    pdfDoc.fontSize(22).text('--------------------------')
    let total = 0
    order.products.forEach(product =>{
      total += product.product.price * product.quantity
      pdfDoc.fontSize(16).text(`${product.product.title} : ${product.quantity} x  $${product.product.price}`)
    })
    pdfDoc.fontSize(22).text('--------------------------')
    pdfDoc.fontSize(18).text(`Total Price: $${total}`)
    pdfDoc.end()
    // })
  })
  .catch(err => next(err))
 
}

exports.postImage = async (req, res, next)=>{
  if(!req.file){ 
    const error = new Error('Image file is invalid')
    error.status = 422
    throw error
  }
  // if(req.body.imageUrl){
  //   const deleteImageResult = await deleteImage(req.body.imageUrl)
  // }
  const imageUrl = await postImage(req.file)
  res.status(201).json({
    imageUrl: imageUrl,
    message: "Image uploaded successfully"
  })
}
