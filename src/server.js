const express = require('express');
const app = express();
const { body, check, validationResult } = require('express-validator');
const cors = require('cors');
const { validateError } = require('./middleware/validator');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { emailAuth, verificationCodes } = require('./emailAuth');
const loginAuth = require('./middleware/loginAuth');

dotenv.config();
app.use(express.json());
app.use(cors());
app.post('/sendVerification', emailAuth);

app.post(
  '/verifyCode',
  [body('email').isEmail(), body('code').notEmpty().isNumeric()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;

    if (
      verificationCodes[email] &&
      parseInt(verificationCodes[email]) === parseInt(code)
    ) {
      console.log('인증 성공');
      delete verificationCodes[email];
      return res.status(200).send('인증 성공');
    } else {
      console.log('인증 실패');
      return res.status(400).send('인증 실패. 유효하지 않은 코드입니다.');
    }
  }
);

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

app.use(loginAuth);
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      console.log('이메일을 찾을 수 없습니다.');
      return res.status(404).send('이메일을 찾을 수 없습니다.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('비밀번호가 일치하지 않습니다.');
      return res.status(400).send('비밀번호를 잘못 입력하였습니다.');
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ token });
  } catch (e) {
    console.error('로그인 오류:', e.message);
    res.status(500).send('Error logging in: ' + e.message);
  }
});

module.exports = app;
