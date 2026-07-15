export type ExpressFileFields =
  | {
      [fieldname: string]: Express.Multer.File[];
    }
  | undefined;
