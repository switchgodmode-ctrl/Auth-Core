import mongoose from "mongoose";    
import mongooseUniqueValidator from "mongoose-unique-validator";

const LicenceSchema = mongoose.Schema({
    _id:{
        type: Number,
        required: true,
    },
       appId: {              
        type: Number,
        required: true
    },
    key: {
        type: String,
        required: true,
        unique: true      
    },
    Day: {
        type: Number,
        required: true
    },
    hwid: {
        type: String,
    },
    hwidSignals: {
        type: Object
    },
    trustScore: {
        type: Number,
        default: 40
    },
    resellerId: {
        type: Number
    },
    features: {
        type: Object,
        default: {}
    },
    forceDisable: {
        type: Boolean,
        default: false
    },
    Status: {
        type: String,
        enum: ["unbanned", "ban", "online", "offline", "killed"],
        default: "unbanned"   
    },
    activatedAt: {
    type: Date,
    },
      isBanned: {
  type: Boolean,
  default: false
}


});

LicenceSchema.plugin(mongooseUniqueValidator);

const LicenceModule = mongoose.model("Licence", LicenceSchema);
export default LicenceModule;
