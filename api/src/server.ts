import { app } from "./app.ts";

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server is listening ${process.env.PORT || 3001}`);
});
