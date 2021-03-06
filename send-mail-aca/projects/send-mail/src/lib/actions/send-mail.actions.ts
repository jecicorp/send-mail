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
import { Action } from '@ngrx/store';
import { MinimalNodeEntryEntity } from '@alfresco/js-api';

export const SEND_BY_MAIL = "SEND_BY_MAIL";

export class SendByMail implements Action {
  readonly type = SEND_BY_MAIL;
  constructor(public payload: MinimalNodeEntryEntity) {}
}
