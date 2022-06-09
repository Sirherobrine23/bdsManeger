import events from "node:events";
import { playerAction1, playerAction2 } from '../globalType';

declare interface bdsServerEvent {
  // Emit
  emit(act: "started", data: Date): boolean;
  emit(act: "err", data: Error|number): boolean;
  emit(act: "closed", data: number): boolean;
  emit(act: "port_listen", data: {port: number; protocol?: "TCP"|"UDP"; version?: "IPv4"|"IPv6"|"IPv4/IPv6"}): boolean;
  emit(act: "log", data: string): boolean;
  emit(act: "log_stdout", data: string): boolean;
  emit(act: "log_stderr", data: string): boolean;
  emit(act: "player", data: playerAction2): boolean;
  emit(act: "player_ban", data: playerAction1): boolean;
  emit(act: "player_connect", data: playerAction1): boolean;
  emit(act: "player_disconnect", data: playerAction1): boolean;
  emit(act: "player_unknown", data: playerAction1): boolean;

  // on
  on(act: "started", fn: (data: Date) => void): this;
  on(act: "err", fn: (data: Error|number) => void): this;
  on(act: "closed", fn: (data: number) => void): this;
  on(act: "player_ban", fn: (data: playerAction1) => void): this;
  on(act: "player", fn: (data: playerAction2) => void): this;
  on(act: "player_connect", fn: (data: playerAction1) => void): this;
  on(act: "player_disconnect", fn: (data: playerAction1) => void): this;
  on(act: "player_unknown", fn: (data: playerAction1) => void): this;
  on(act: "port_listen", fn: (data: {port: number; protocol?: "TCP"|"UDP"; version?: "IPv4"|"IPv6"|"IPv4/IPv6"}) => void): this;
  on(act: "log", fn: (data: string) => void): this;
  on(act: "log_stdout", fn: (data: string) => void): this;
  on(act: "log_stderr", fn: (data: string) => void): this;

  // Once
  once(act: "started", fn: (data: Date) => void): this;
  once(act: "err", fn: (data: Error|number) => void): this;
  once(act: "closed", fn: (data: number) => void): this;
  once(act: "player_ban", fn: (data: playerAction1) => void): this;
  once(act: "player", fn: (data: playerAction2) => void): this;
  once(act: "player_connect", fn: (data: playerAction1) => void): this;
  once(act: "player_disconnect", fn: (data: playerAction1) => void): this;
  once(act: "player_unknown", fn: (data: playerAction1) => void): this;
  once(act: "port_listen", fn: (data: {port: number; protocol?: "TCP"|"UDP"; version?: "IPv4"|"IPv6"|"IPv4/IPv6"}) => void): this;
  once(act: "log", fn: (data: string) => void): this;
  once(act: "log_stdout", fn: (data: string) => void): this;
  once(act: "log_stderr", fn: (data: string) => void): this;
}

class bdsServerEvent extends events {}
export default bdsServerEvent;
export {bdsServerEvent};