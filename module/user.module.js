import mongoose from "mongoose";
import mongooseUniqueValidator from "mongoose-unique-validator";   
const UserSchema = mongoose.Schema({
    _id:Number,
    username:{
        type:String,
        required:[true,"Username is required"],
        trim:true,
    },
    password:{
        type:String,
        required:[true,"Password is required"],
        trim:true,
    },
    email:{
        type:String,
        required:[true,"email is required"],
        unique:true,
        trim:true,
    },
    plan:{
        type:String,
        enum:["Free","Premium","Reseller"],
        default:"Premium"
    },
    refreshToken:{
        type:String
    },
    verificationToken:{
        type:String
    },
    verifiedAt:{
        type:Date
    },
    resetToken:{
        type:String
    },
    resetExpires:{
        type:Date
    },
    status:Number,
    info:String,
    mail:String,
    avatar:{
        type:String,
        default:""
    },
    sessions: [{
        token: String,
        device: String,
        ip: String,
        lastActive: { type: Date, default: Date.now }
    }],
    activityLogs: [{
        action: String,
        ip: String,
        details: String,
        timestamp: { type: Date, default: Date.now }
    }],
    referralCode: {
        type: String,
        unique: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UsersRegister'
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    sdkAccess: {
        type: Boolean,
        default: false
    }
})
UserSchema.plugin(mongooseUniqueValidator)
const UserModule = mongoose.model("UsersRegister",UserSchema);
export default UserModule;
