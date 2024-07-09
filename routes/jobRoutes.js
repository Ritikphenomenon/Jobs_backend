
const express = require("express");

const { Job } = require("../db/jobSchema");
const {authenticateJwt} = require("../middleware/index")
const router = express.Router();
const dotenv = require("dotenv");

dotenv.config();



router.get("/getall", async (req, res) => {
  const jobs = await Job.find({ expired: false });
  res.status(200).json({
    success: true,
    jobs,
  });
});



router.post("/post",authenticateJwt,async (req, res) =>{
  try{
  const { role } = req.user;
  if (role === "Job Seeker") {
     return res.status(400).json({message:"Job Seeker not allowed to access this resource."})
  }
  const {
    title,
    description,
    category,
    country,
    city,
    location,
    fixedSalary,
    salaryFrom,
    salaryTo,
  } = req.body;

  if (!title || !description || !category || !country || !city || !location) {
    return res.status(400).json({message:"Please provide full job details."});
  }

  if ((!salaryFrom || !salaryTo) && !fixedSalary) {
    return res.status(400).json({
         message:
        "Please either provide fixed salary or ranged salary."}
      )
  }

  if (salaryFrom && salaryTo && fixedSalary) {
    return res.status(400).json({message:"Cannot Enter Fixed and Ranged Salary together."})
  }


  const postedBy = req.user._id;
  console.log(postedBy);
  console.log(req.user);
  const job = await Job.create({
    title,
    description,
    category,
    country,
    city,
    location,
    fixedSalary,
    salaryFrom,
    salaryTo,
    postedBy,
  });
  res.status(200).json({
    success: true,
    message: "Job Posted Successfully!",
    job,
  });
}
catch (error) {
  res.status(500).json({ message: `${error}` });
}
});

  
router.get("/getmyjobs",authenticateJwt,async(req,res)=>{
  try{
    const { role } = req.user;
    if (role === "Job Seeker") {
      return res.status(400).json({message:"Job Seeker not allowed to access this resource."})
    }

    const myJobs = await Job.find({ postedBy: req.user._id });
    res.status(200).json({
      success: true,
      myJobs,
    });
  }
  catch(error){
    res.status(400).json({message:`${error}`});
  }
})


router.put("/update/:id",authenticateJwt,async(req,res)=>{
  try{
    const { role } = req.user;
  if (role === "Job Seeker") {
    return res.status(400).json({message:"Job Seeker not allowed to access this resource."})
  }
  const { id } = req.params;
  let job = await Job.findById(id);
  if (!job) {
    return res.status(404).json({message:"OOPS! Job not found.",});
  }
  job = await Job.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    message: "Job Updated!",
  });
  }
  catch(error){
    res.status(400).json({message:`${error}`});
  }
})


router.delete("/delete/:id",authenticateJwt,async(req,res)=>{
  try{
    const { role } = req.user;
    if (role === "Job Seeker") {
      return res.status(400).json({message:"Job Seeker not allowed to access this resource."})
    }
    const { id } = req.params;
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({message:"OOPS! Job not found."});
    }
    await job.deleteOne();
    res.status(200).json({
      success: true,
      message: "Job Deleted!",
    });
  }
  catch(error){
    res.status(400).json({message:`${error}`});
  }
})



router.get("/:id",authenticateJwt,async(req,res)=>{
  const { id } = req.params;
  try{
    const job = await Job.findById(id);
    if (!job) {
      return next(new ErrorHandler("Job not found.", 404));
    }
    res.status(200).json({
      success: true,
      job,
    });
  }
  catch(error){
    res.status(400).json({message:`${error}`});
  }
})

module.exports=router;



