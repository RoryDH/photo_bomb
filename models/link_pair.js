'use strict';

var mongoose = require('mongoose');
var _ = require('underscore');
var crypto = require('crypto');
var u = require('../utils')

var linkPairSchema = mongoose.Schema({
  createdAt: Date,
  swapID: String,
  webLinks: [{
              userDescription: String,
              webURL: String,
              ipAddress: String,
              original: Boolean,
              createdAt: Date
            }]
});

linkPairSchema.statics = {
	findSingle: function(cb){
		this.findOne({webLinks: {$size: 1}}, cb);
	}
};

linkPairSchema.methods = {
	joinPair: function(cb){
	  var timestamp = new Date;
	  var newSwap = this;
		newSwap.webLinks[0].createdAt = timestamp;

		this.constructor.findSingle(function(err, obj){
			if(err) return handleError(err);
			if(obj){
				newSwap.webLinks[0].original = false;
				obj.webLinks.push(newSwap.webLinks[0]);
        obj.save(cb);
			}else{
				newSwap.createdAt = timestamp;
				newSwap.webLinks[0].original = true;
				newSwap.setSwapID().save(cb);
			}
		});
	},

	resObj: function()
	{
	  var links = _.map(this.webLinks, function(liO){
	  	return {
	  		desc:     liO.userDescription,
        url:      liO.webURL,
        original: liO.original
      }
    });
	  return {
	    swapID: this.swapID,
	    pollStatus: this.pollStatus,
	    links: links
	  };
	},

	setSwapID: function()
	{
	  var shasum = crypto.createHash('sha1');
	  shasum.update(this._id + u.salt);
	  this.swapID = shasum.digest('hex');
	  return this;
	}
}

linkPairSchema.virtual("pollStatus").get(function(){
	if(this.webLinks == null || this.webLinks == undefined || this.webLinks == []) return 0;
	return(this.webLinks.length);
});

mongoose.model('LinkPair', linkPairSchema);