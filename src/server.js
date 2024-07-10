const express = require('express');
const app = express();
const { body, check } = require('express-validator');
const cors = require('cors');
const { validateError } = require('./middleware/validator');
const User = require('./models/User');
const bcrypt = require('bcrypt');

app.use(express.json());
app.use(cors());

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
