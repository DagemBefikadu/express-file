const mongoose = require('mongoose')

const contactFormSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        campaign: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Campaign',
            required: true
        }
    }, 
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Contact', contactFormSchema)