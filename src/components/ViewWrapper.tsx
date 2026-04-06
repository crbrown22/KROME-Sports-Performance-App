import { ReactNode } from "react";
import { PageTransition } from "./PageTransition";

interface ViewWrapperProps {
  viewKey: string;
  children: ReactNode;
}

export const ViewWrapper = ({ viewKey, children }: ViewWrapperProps) => {
  return (
    <PageTransition viewKey={viewKey}>
      {children}
    </PageTransition>
  );
};
