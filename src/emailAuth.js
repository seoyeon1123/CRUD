const nodemailer = require('nodemailer');

const generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const transporter = nodemailer.createTransport({
  host: 'smtp.naver.com',
  port: 587,
  secure: false,
  auth: {
    user: 'lsy_0906@naver.com',
    pass: 'LHKMNHTBY1JF',
  },
});

let verificationCodes = {}; // Declare once

const emailAuth = async (req, res) => {
  const { email } = req.body;

  const number = generateRandomNumber(111111, 999999);
  verificationCodes[email] = number;

  try {
    const mailOptions = {
      from: 'lsy_0906@naver.com',
      to: email,
      subject: '인증 관련 메일입니다.',
      html: `<h1>인증번호를 입력해주세요 ${number}</h1>`,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent');

    res.json({ ok: true, msg: '메일 전송에 성공하였습니다.' });
  } catch (error) {
    console.error('Failed to send email:', error);
    res.status(500).json({ ok: false, msg: '메일 전송에 실패하였습니다.' });
  }
};

module.exports = { emailAuth, verificationCodes }; // Export both
