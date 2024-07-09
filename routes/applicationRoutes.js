
const express = require("express");
const { Application } = require("../db/applicationSchema.js");
const { authenticateJwt } = require("../middleware/index.js");
const { Job } = require("../db/jobSchema.js");
const cloudinary = require('../config/cloudinary');
const dotenv = require("dotenv");
const router = express.Router();
dotenv.config();



router.post("/post",authenticateJwt,async(req,res)=>{
    try{
        const { role } = req.user;

        if (role === "Employer") {
          return res.status(400).json({message:"Employer not allowed to access this resource."});
                }
        
        if (!req.files || Object.keys(req.files).length === 0) {
          return  res.status(400).json({message:"Resume File Required!"});
        }
      
        const { resume } = req.files;
        const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
        if (!allowedFormats.includes(resume.mimetype)) {
          return res.status(400).json({message:"Invalid file type. Please upload a PNG file."})
        }
        
        const cloudinaryResponse = await cloudinary.uploader.upload(
          resume.tempFilePath
        );
      
        if (!cloudinaryResponse || cloudinaryResponse.error) {
          console.error(
            "Cloudinary Error:",
            cloudinaryResponse.error || "Unknown Cloudinary error"
          );
          return res.status(500).json({message:"Failed to upload Resume to Cloudinary",});
        }
        const { name, email, coverLetter, phone, address, jobId } = req.body;
        const applicantID = {
          user: req.user._id,
          role: "Job Seeker",
        };
        if (!jobId) {
          return res.status(404).json({message:"Job not found!"});
        }
        const jobDetails = await Job.findById(jobId);
        if (!jobDetails) {
          return res.status(404).json({message:"Job not found!"});
        }
      
        const employerID = {
          user: jobDetails.postedBy,
          role: "Employer",
        };
        if (
          !name ||
          !email ||
          !coverLetter ||
          !phone ||
          !address ||
          !applicantID ||
          !employerID ||
          !resume
        ) {
            
          return res.status(404).json({message:"Please fill all fields."})
        }
        const application = await Application.create({
          name,
          email,
          coverLetter,
          phone,
          address,
          applicantID,
          employerID,
          resume: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
          },
        });
        res.status(200).json({
          success: true,
          message: "Application Submitted!",
          application,
        });
    }
    catch(error){
        return res.status(500).json({message:`${error}`});
    }
})

router.get("/employer/getall",authenticateJwt,async(req,res)=>{
    try{
        const { role } = req.user;
        if (role === "Job Seeker") {
          return res.status(400).json({message:"Job Seeker not allowed to access this resource."})
        }
        const { _id } = req.user;
        const applications = await Application.find({ "employerID.user": _id });
        res.status(200).json({
          success: true,
          applications,
        });
    }
    catch(error){
        return res.send.json({message:`${error}`});
    }
})

router.get("/jobseeker/getall",authenticateJwt,async(req,res)=>{
     try{
        const { role } = req.user;
    if (role === "Employer") {
      return res.status(400).json({message:"Employer not allowed to access this resource."});
    }
    const { _id } = req.user;
    const applications = await Application.find({ "applicantID.user": _id });
    res.status(200).json({
      success: true,
      applications,
    });
     }
     catch(error){
        return res.send.json({message:`${error}`});
     }
})

router.delete("/delete/:id",authenticateJwt,async(req,res)=>{
    try{
    const { role } = req.user;
    if (role === "Employer") {
      return res.status(400).json({message:"Employer not allowed to access this resource."});
    }
    const { id } = req.params;
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({message:"Application not found!"});
    }
    await application.deleteOne();
    res.status(200).json({
      success: true,
      message: "Application Deleted!",
    });
    }
    catch(error){
        return res.send.json({message:`${error}`});
    }
})

module.exports=router;
