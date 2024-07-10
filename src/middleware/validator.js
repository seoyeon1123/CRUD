const { validationResult } = require('express-validator');

const validateError = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    console.log({ error: firstError.msg }); // 콘솔에 JSON 형태로 에러 메시지 출력

    return res.status(400).json({ error: firstError.msg }); // 클라이언트에 JSON 응답 전송
  }
  next(); // 유효성 검사 에러가 없으면 다음으로 제어 넘기기
};

module.exports = {
  validateError,
};
