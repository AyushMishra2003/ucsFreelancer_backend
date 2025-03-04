import RoleModel from "../../models/operator_auth/role.model.js"
import AppError from "../../utilis/error.utlis.js"


const addRole=async(req,res,next)=>{
    try{
         const {title}=req.body
         
         if(!title){
              return next(new AppError("Title is required",400))
         }

         const validTitle=await RoleModel.findOne({title})

        if(validTitle){
             return next(new AppError("Role already exists",400))
        }

        const addRole=await RoleModel.create({title})

        await addRole.save()

        res.status(201).json({
            success:true,
            message:"Role added successfully",
            data:addRole
        })

    }catch(error){
         return next(new AppError(error.message,500))
    }
}


const getRole=async(req,res,next)=>{
     try{

        const allRole=await RoleModel.find({})

        if(!allRole){
            return next(new AppError("No role found",404))
        }

        res.status(200).json({
            success:true,
            message:"All roles",
            data:allRole
        })


     }catch(error){
            return next(new AppError(error.message,500))
     }
}

const updateRole=async(req,res,next)=>{
    try{
         const {id}=req.params
         const {title}=req.body
         
         const validTitle=await RoleModel.findById(id)
         
         if(!validTitle){
             return next(new AppError("Role not found",404))
         }

         validTitle.title=title

         await validTitle.save()

         res.status(200).json({
             success:true,
             message:"Role updated successfully",
             data:validTitle
         })


    }catch(error){
        return next(new AppError(error.message,500))
    }   
}

const deleteRole=async(req,res,next)=>{
     try{

        const {id}=req.params

        const validTitle=await RoleModel.findById(id)

        if(!validTitle){
            return next(new AppError("Role not found",404))
        }

        await RoleModel.findByIdAndDelete(id)

        res.status(200).json({
            success:true,
            message:"Role deleted successfully"
        })

     }catch(error){
        return next(new AppError(error.message,500))
     }
}


export {addRole,getRole,updateRole,deleteRole}