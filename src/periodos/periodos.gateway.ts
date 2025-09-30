import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PeriodosGateway {
  @WebSocketServer()
  server: Server;

  notifyPeriodoCreado(periodo: any) {
    this.server.emit('periodoCreado', periodo);
  }

  notifyPeriodoAperturado(periodo: any) {
    this.server.emit('periodoAperturado', periodo);
  }
}