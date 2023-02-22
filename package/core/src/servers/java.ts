import { manegerOptions } from "../serverManeger.js";

export type javaOptions = manegerOptions & {
  /**
   * Servidor alternativo ao invés do servidor ofical da Mojang
   */
  altServer?: "spigot"|"paper"|"purpur",
  allowBeta?: boolean
};
