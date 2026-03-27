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
    }
})
UserSchema.plugin(mongooseUniqueValidator)
const UserModule = mongoose.model("UsersRegister",UserSchema);
export default UserModule;
