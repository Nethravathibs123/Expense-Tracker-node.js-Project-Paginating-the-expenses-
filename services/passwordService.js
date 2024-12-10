const uuid = require('uuid');
const { TransactionalEmailsApi, SendSmtpEmail, ApiClient } = require('@getbrevo/brevo');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Forgotpassword = require('../models/password');
const sequelize = require('../util/database');

const port = process.env.PORT || 3000;

exports.forgotpassword = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email }, transaction: t });
        if (!user) {
            throw new Error('User does not exist');
        }
        const id = uuid.v4();
        await user.createForgotpassword(
            { id, isactive: "ACTIVE", userId: user.id },
            { transaction: t }
        );
        await t.commit();
        const brevoApiKey = process.env.PASSWORD_KEY;
        if (!brevoApiKey) {
            throw new Error('Brevo API key is missing. Check PASSWORD_KEY in .env file.');
        }

        const apiClient = ApiClient.instance; 
        apiClient.authentications['api-key'].apiKey = brevoApiKey;

        const apiInstance = new TransactionalEmailsApi(apiClient);
        const sendSmtpEmail = new SendSmtpEmail();
        sendSmtpEmail.subject = 'Reset Password Request';
        sendSmtpEmail.htmlContent = `
            <p>Click the link below to reset your password.</p>
            <a href="http://localhost:${port}/password/resetpassword/${id}">Reset Password</a>
        `;
        sendSmtpEmail.sender = { name: 'Nethravathi B S', email: 'nethranethra451@gmail.com' };
        sendSmtpEmail.to = [{ email }];

        await apiInstance.sendTransacEmail(sendSmtpEmail);

        console.log('Email sent successfully');
        return {status : 200, message: 'Link to reset password sent to your email', success: true };

    } catch (err) {
        if (!t.finished) {
            await t.rollback();
        }
        console.error(err);
        return {status:500,  message: err.message, success: false };
    }
};

exports.resetpassword = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const id = req.params.id;
        const forgotpasswordrequest = await Forgotpassword.findOne({ where: { id }, transaction: t });

        if (!forgotpasswordrequest) {
            throw new Error('Invalid reset password request');
        }
        return { status: 200, success: true, html: `
            <html>
                <form action="/password/updatepassword/${id}" method="get">
                    <label for="newpassword">Enter New Password</label>
                    <input name="newpassword" type="password" required></input>
                    <button>Reset Password</button>
                </form>
            </html>` };
    } catch (err) {
        if (!t.finished) {
            await t.rollback();
        }
        console.error(err);
        return { status: 500, success: false, error: err.message };
    }
};


exports.updatepassword = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { newpassword } = req.query;
        const { resetpasswordid } = req.params;

        const resetpasswordrequest = await Forgotpassword.findOne({ where: { id: resetpasswordid }, transaction: t });
        if (!resetpasswordrequest) {
            throw new Error('Invalid reset request');
        }

        const user = await User.findOne({ where: { id: resetpasswordrequest.userId }, transaction: t });
        if (!user) {
            throw new Error('No user exists');
        }
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(newpassword, salt);

        await user.update({ password: hash }, { transaction: t });
                await t.commit();

        return { status: 201, message: 'Successfully updated the new password', success: true };
    } catch (error) {
        if (!t.finished) {
            await t.rollback();
        }
        console.error(error);
        return { status: 403, success: false, error: error.message };
    }
};



