import { MyComposition } from "./Composition";
import { Verticais } from "./Vertical";
import { Cinemas } from "./Cinema";
import { Esculturas } from "./Escultura";
import { Tipografias } from "./Tipografia";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Verticais />
      <Cinemas />
      <Esculturas />
      <Tipografias />
    </>
  );
};
