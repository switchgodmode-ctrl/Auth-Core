import mongoose from 'mongoose';
import mongooseUniqueValidator from 'mongoose-unique-validator';
const ApplicationSchema = mongoose.Schema({
_id:{
    type:Number,
    required: true,
},appName: {
    type:String,
    required:[true,"App name is required"],
},
description:{
    type:String,
    required:[true,"Description is required"],
    trim:true,

},
ownerId:{
    type:Number,
    required:[true,"ownerId is required"],
},
appSecret:{
    type:String,
    required:true,
},
ownerSeq:{
    type:Number,
    required:true,
},
version:{
    type:String,
    default:"1.0",
},
status:{
    type:String,
    default:"active",
},
remotePayload:{
    type:String,
    default:"",
},
createdAt:{
    type:Date,
    default:Date.now,
},
})
ApplicationSchema.index({appName :1,ownerId:1},{unique:true});
ApplicationSchema.index({ownerId:1,ownerSeq:1},{unique:true});
ApplicationSchema.plugin(mongooseUniqueValidator);
const ApplicationModule = mongoose.model("Applications",ApplicationSchema);
export default ApplicationModule;
