import { DetailedHTMLProps, HTMLAttributes } from "react";
import Style from "./skeletonLoading.module.css";

export default function Load(props?: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
  return <div {...props}>
    <div className={Style["animated-background"]}>
      <div className={`${Style["background-masker"]} ${Style["btn-divide-left"]}`}></div>
    </div>
  </div>;
}