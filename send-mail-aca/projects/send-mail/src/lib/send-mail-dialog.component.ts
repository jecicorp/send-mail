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

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatChipInputEvent } from '@angular/material/chips';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { MinimalNodeEntryEntity } from '@alfresco/js-api';
import { TranslationService, AlfrescoApiService, EcmUserService, EcmUserModel } from '@alfresco/adf-core';
import { Observable } from 'rxjs';

@Component({
  selector: 'sendByMail-dialog',
  templateUrl: './send-mail-dialog.component.html',
  styleUrls: ['./send-mail-dialog.component.scss']
})
export class SendMailDialogComponent implements OnInit {

  messageTemplate: string;
  title: string;
  shareLink: string;
  node: MinimalNodeEntryEntity;
  nodeExist: boolean = false;

  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  recipientsTo: string[] = [];
  recipientsCc: string[] = [];
  recipientsCci: string[] = [];
  emailForm: FormGroup;

  constructor(private dialogRef: MatDialogRef<SendMailDialogComponent>,
    private translationService: TranslationService,
    private apiService: AlfrescoApiService,
    private formBuilder: FormBuilder,
    private ecmUserService: EcmUserService,
    @Inject(MAT_DIALOG_DATA) data) {
    this.node = data.node;
    if (this.node) {
      this.nodeExist = true;
      this.title = this.translationService.instant(
        'APP.FORM.TITLE',
        { name: this.node.name }
      );
      this.shareLink = data.baseShareUrl + data.sharedId;
    }
  }

  ngOnInit() {
    // Construction du message template
    this.ecmUserService.getCurrentUserInfo().subscribe((user) => {
      this.messageTemplate = "Bonjour,\n\n";
      this.messageTemplate += user.firstName + " " + user.lastName + " vient de partager un fichier avec vous depuis sa GED Pristy.";
      this.messageTemplate += "Vous pouvez y acc??der gr??ce au lien ci-dessous : \n";
      this.messageTemplate += this.shareLink;
      this.messageTemplate += "\n\nCordialement";
    });

    // Initialisation Formulaire
    this.emailForm = this.formBuilder.group({
      recipientsTo: [[], Validators.required],
      recipientsCc: [],
      recipientsCci: [],
      object: ['', Validators.required],
      message: ['', Validators.required],
      isAttachment: []
    });
  }

  private getListRecipients(typeRecipient: string) {
    switch (typeRecipient) {
      case 'TO':
        return this.recipientsTo;
      case 'CC':
        return this.recipientsCc;
      case 'CCI':
        return this.recipientsCci;
    }
  }

  private refreshValueInForm(typeRecipient: string) {
    const listEmail = this.getListRecipients(typeRecipient);
    switch (typeRecipient) {
      case 'TO':
        this.emailForm.get('recipientsTo').setValue(listEmail);
      case 'CC':
        this.emailForm.get('recipientsCc').setValue(listEmail);
      case 'CCI':
        this.emailForm.get('recipientsCci').setValue(listEmail);
    }
  }

  private isEmailValid(email: string): boolean {
    const EMAIL_REGEXP = new RegExp(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/);
    return EMAIL_REGEXP.test(email);
  }

  addRecipient(typeRecipient: string, event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Ajout d'un ??l??ment
    if ((value || '').trim()) {
      const newValue = value.trim();
      const emailValid = this.isEmailValid(newValue);
      if (emailValid) {
        this.getListRecipients(typeRecipient).push(newValue);

        // Reset la valeur du champ
        if (input) {
          input.value = '';
        }
      }
      this.refreshValueInForm(typeRecipient);
    }
  }

  removeRecipient(typeRecipient: string, recipient: string) {
    const index = this.getListRecipients(typeRecipient).indexOf(recipient);
    if (index >= 0) {
      this.getListRecipients(typeRecipient).splice(index, 1);
    }
    this.refreshValueInForm(typeRecipient);
  }

  cancel() {
    // Fermer la popup()
    this.dialogRef.close();
  }

  sendMail() {
    // R??cup??rer les valeurs
    const params = {
      recipients: this.getListRecipients('TO').join(";"),
      recipientsInCopy: this.getListRecipients('CC').join(";"),
      recipientsInHiddenCopy: this.getListRecipients('CCI').join(";"),
      object: this.emailForm.value['object'],
      message: this.emailForm.value['message'],
      nodeId: this.node.id,
      isAttachment: this.emailForm.value['isAttachment'] ? this.emailForm.value['isAttachment'] : false
    };

    // Envoyer le mail - Appel du webservice
    this.apiService.getInstance().webScript.executeWebScript(
      'POST',
      '/fr/jeci/sendMail',
      params,
      'alfresco',
      'service'
    );

    // Fermer la popup
    this.dialogRef.close();
  }
}
