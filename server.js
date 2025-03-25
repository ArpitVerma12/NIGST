const app = require("./app");

PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`server is listening at PORT : ${PORT}`);
});
