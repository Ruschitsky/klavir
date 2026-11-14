import { createRoot } from "react-dom/client";
import { Trainer } from "@/components/typing/trainer";

const root = document.getElementById("root");
if (root) createRoot(root).render(<Trainer />);
