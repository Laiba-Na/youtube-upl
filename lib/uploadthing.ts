// lib/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "../app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .input(z.object({ projectId: z.string() }))
    .middleware(async ({ input }) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id, projectId: input.projectId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const { userId, projectId } = metadata;

      const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
      });
      if (!project) throw new Error("Project not found or unauthorized");

      const asset = await prisma.asset.create({
        data: {
          name: file.name,
          type: "image",
          path: file.url,
          projectId,
        },
      });

      console.log(`Upload complete for user ${userId}, asset ID: ${asset.id}`);
      return { url: file.url, assetId: asset.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;