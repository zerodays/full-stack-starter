import { createRouter } from "@/server/lib/router";
import { createProjectRoute } from "./routes/create-project";
import { deleteProjectRoute } from "./routes/delete-project";
import { getProjectRoute } from "./routes/get-project";
import { listProjectsRoute } from "./routes/list-projects";

export const projects = createRouter()
  .route("/", listProjectsRoute)
  .route("/", createProjectRoute)
  .route("/", getProjectRoute)
  .route("/", deleteProjectRoute);
