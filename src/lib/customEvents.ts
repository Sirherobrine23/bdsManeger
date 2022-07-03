import events from "node:events";
import { playerAction1, playerAction2 } from '../globalType';

export declare interface bdsServerEvent {
  emit(act: "started", data: Date): boolean;
  once(act: "started", fn: (data: Date) => void): this;
  on(act: "started", fn: (data: Date) => void): this;

  emit(act: "err", data: Error|number): boolean;
  on(act: "err", fn: (data: Error|number) => void): this;
  once(act: "err", fn: (data: Error|number) => void): this;

  emit(act: "closed", data: number): boolean;
  once(act: "closed", fn: (data: number) => void): this;
  on(act: "closed", fn: (data: number) => void): this;

  emit(act: "port_listen", data: {port: number; protocol?: "TCP"|"UDP"; version?: "IPv4"|"IPv6"|"IPv4/IPv6"}): boolean;
  once(act: "port_listen", fn: (data: {port: number; protocol?: "TCP"|"UDP"; version?: "IPv4"|"IPv6"|"IPv4/IPv6"}) => void): this;
  on(act: "port_listen", fn: (data: {port: number; protocol?: "TCP"|"UDP"; version?: "IPv4"|"IPv6"|"IPv4/IPv6"}) => void): this;

  emit(act: "log", data: string): boolean;
  once(act: "log", fn: (data: string) => void): this;
  on(act: "log", fn: (data: string) => void): this;

  emit(act: "log_stdout", data: string): boolean;
  once(act: "log_stdout", fn: (data: string) => void): this;
  on(act: "log_stdout", fn: (data: string) => void): this;

  emit(act: "log_stderr", data: string): boolean;
  once(act: "log_stderr", fn: (data: string) => void): this;
  on(act: "log_stderr", fn: (data: string) => void): this;

  emit(act: "player", data: playerAction2): boolean;
  once(act: "player", fn: (data: playerAction2) => void): this;
  on(act: "player", fn: (data: playerAction2) => void): this;

  emit(act: "player_ban", data: playerAction1): boolean;
  once(act: "player_ban", fn: (data: playerAction1) => void): this;
  on(act: "player_ban", fn: (data: playerAction1) => void): this;

  emit(act: "player_connect", data: playerAction1): boolean;
  once(act: "player_connect", fn: (data: playerAction1) => void): this;
  on(act: "player_connect", fn: (data: playerAction1) => void): this;

  emit(act: "player_disconnect", data: playerAction1): boolean;
  once(act: "player_disconnect", fn: (data: playerAction1) => void): this;
  on(act: "player_disconnect", fn: (data: playerAction1) => void): this;

  emit(act: "player_unknown", data: playerAction1): boolean;
  once(act: "player_unknown", fn: (data: playerAction1) => void): this;
  on(act: "player_unknown", fn: (data: playerAction1) => void): this;
}

export class bdsServerEvent extends events {}
export default bdsServerEvent;