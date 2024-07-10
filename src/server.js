const express = require('express');
const app = express();
const { body, check, validationResult } = require('express-validator');
const cors = require('cors');
const { validateError } = require('./middleware/validator');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const { emailAuth, verificationCodes } = require('./emailAuth');

app.use(express.json());
app.use(cors());

app.post('/sendVerification', emailAuth);

app.post(
  '/verifyCode',
  [body('email').isEmail(), body('code').notEmpty().isNumeric()],
  (req, res) => {
    const errors = validationResult(req); // Use validationResult here
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;

    // verificationCodes 객체에서 인증 번호 확인
    if (
      verificationCodes[email] &&
      parseInt(verificationCodes[email]) === parseInt(code)
    ) {
      console.log('인증 성공');
      delete verificationCodes[email]; // 인증이 성공하면 verificationCodes에서 삭제
      return res.status(200).send('인증 성공');
    } else {
      console.log('인증 실패');
      return res.status(400).send('인증 실패. 유효하지 않은 코드입니다.');
    }
  }
);
// 유효성 검사 및 라우트 설정
app.post(
  '/user',
  [
    check('name')
      .notEmpty()
      .withMessage('이름은 필수 작성해야 합니다.')
      .isLength({ min: 2 })
      .withMessage('이름은 최소 2자 이상이어야 합니다.'),
    check('email')
      .isEmail()
      .withMessage('올바른 이메일 형식을 입력하세요')
      .normalizeEmail(),
    check('password')
      .notEmpty()
      .withMessage('비밀번호는 필수 작성해야 합니다.')
      .isLength({ min: 6 })
      .withMessage('비밀번호는 최소 6자 이상이어야 합니다.'),
  ],
  validateError,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name, email, password: hashedPassword });

      await newUser.save();
      console.log('User saved:', newUser);

      return res.status(201).json({ user: newUser });
    } catch (err) {
      console.error('User 저장 오류:', err);
      return res.status(500).json({ error: err.message });
    }
  }
);

module.exports = app; // Express 애플리케이션 객체를 모듈로 내보냄
