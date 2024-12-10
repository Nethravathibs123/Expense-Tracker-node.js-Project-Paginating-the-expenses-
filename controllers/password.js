const passwordService=require('../services/passwordService');

module.exports.forgotpassword = async(req,res)=>{
  
   const result=await passwordService.forgotpassword(req);

   return res.status(result.status).json({ message: result.message, error: result.error });
}


module.exports.resetpassword = async (req, res, next) => {
    const result = await passwordService.resetpassword(req);

    if (result.status === 200 && result.html) {
        return res.status(result.status).send(result.html);
    }
    return res.status(result.status).json({ message: result.message, error: result.error });
};

module.exports.updatepassword = async (req, res, next) => {
    const result = await passwordService.updatepassword(req);

    return res.status(result.status).json({
        message: result.message,
        success: result.success,
        error: result.error,
    });
};

