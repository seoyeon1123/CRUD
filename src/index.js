const app = require('./server');
const connectDB = require('./db');

const PORT = 3000;

// MongoDB 연결
connectDB()
  .then(() => {
    // 서버 시작
    app.listen(PORT, () => {
      console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    });
  })
  .catch((err) => {
    console.error('MongoDB 연결 오류:', err);
  });
