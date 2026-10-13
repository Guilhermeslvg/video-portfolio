import { MyComposition } from "./Composition";
import { Verticais } from "./Vertical";
import { Cinemas } from "./Cinema";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Verticais />
      <Cinemas />
    </>
  );
};
