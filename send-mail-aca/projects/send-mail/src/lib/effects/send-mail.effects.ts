/*
 * Copyright (C) 2020 Jeci.
 * https://jeci.fr/
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';

import { SendByMail, SEND_BY_MAIL } from '../actions/send-mail.actions';
import { SendMailService } from '../send-mail.service';

@Injectable()
export class SendMailEffects {
  constructor(private actions$: Actions,
    private sendMailService: SendMailService) { }

  @Effect({ dispatch: false })
  sendByMail$ = this.actions$.pipe(
    ofType<SendByMail>(SEND_BY_MAIL),
    map(action => {
      if (action.payload) {
        this.sendMailService.sendByMail(action.payload);
      }
    })
  );

}
