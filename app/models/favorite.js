const mongoose = require('mongoose')


const favoriteFormSchema = new mongoose.Schema(
    {
		favoriteCampaign: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}],
    },
    {
        timestamps: true
    }
)  
//Whats

module.exports = mongoose.model('Favorite', favoriteFormSchema)