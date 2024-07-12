require('dotenv').config({
  path: '/Users/iseoyeon/Desktop/workspace/CRUD/src/.env',
});

const express = require('express');
const app = express();
const { body, check, validationResult } = require('express-validator');
const { validateError } = require('./middleware/validator');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { emailAuth, verificationCodes } = require('./emailAuth');
const loginAuth = require('./middleware/loginAuth');

const cors = require('cors');
app.use(cors());
app.use(express.json());

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
    res.type('application/json');
    return res.status(200).json({ token });
  } catch (e) {
    console.error('로그인 오류:', e.message);
    return res.status(500).send('Error logging in: ' + e.message);
  }
});

app.get('/user', loginAuth, async (req, res) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id; // JWT 토큰에서 추출한 사용자 ID

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 정보 응답
    return res.status(200).json({ user });
  } catch (error) {
    console.error('사용자 정보를 가져오는 중 오류 발생:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.use(loginAuth);

app.get('/home', loginAuth, (req, res) => {
  // 인증 미들웨어를 통해 유효한 JWT를 검증한 후, 사용자 ID를 URL에 추가하여 반환
  const userId = req.user.userId;
  res.redirect(`http://localhost:300/home?user=${userId}`);
});

module.exports = app;
