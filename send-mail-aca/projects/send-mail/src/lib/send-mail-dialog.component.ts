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
import { MAT_DIALOG_DATA, MatDialogRef, MatChipInputEvent } from '@angular/material';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { MinimalNodeEntryEntity } from '@alfresco/js-api';
import { TranslationService, AlfrescoApiService } from '@alfresco/adf-core';

@Component({
  selector: 'sendByMail-dialog',
  templateUrl: './send-mail-dialog.component.html',
  styleUrls: ['./send-mail-dialog.component.scss']
})
export class SendMailDialogComponent implements OnInit {

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
    // Initialisation Formulaire
    this.emailForm = this.formBuilder.group({
      recipientsTo: [[], Validators.required],
      recipientsCc: [],
      recipientsCci: [],
      object: ['', Validators.required],
      message: ['', Validators.required],
      isAttachment: [],
    })
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

    // Ajout d'un élément
    if ((value || '').trim()) {
      const newValue = value.trim();
      const emailValid = this.isEmailValid(newValue);
      if (emailValid) {
        console.log("ADD : " + value.trim());
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
    // Récupérer les valeurs
    const params = {
      recipients: this.getListRecipients('TO').join(";"),
      recipientsInCopy: this.getListRecipients('CC').join(";"),
      recipientsInHiddenCopy: this.getListRecipients('CCI').join(";"),
      object: this.emailForm.value['object'],
      message: this.emailForm.value['message'],
      nodeId: this.node.id,
      isAttachment: this.emailForm.value['isAttachment'] ? this.emailForm.value['isAttachment'] : false
    }
    console.log("Récupération des paramètres");
    console.log("recipients : " + params.recipients);
    console.log("recipients in copy : " + params.recipientsInCopy);
    console.log("recipients in hidden copy : " + params.recipientsInHiddenCopy);
    console.log("object : " + params.object);
    console.log("message : " + params.message);
    console.log("nodeId : " + params.nodeId);
    console.log("isAttachment : " + params.isAttachment);

    // Envoyer le mail - Appel du webservice

    //executeWebScript(httpMethod?: string, scriptPath?: string, scriptArgs?: any, contextRoot?: string, servicePath?: string, postBody?: string): Promise<{}>;
    //http(s)://(host):(port)/(contextPath)/(servicePath)/(scriptPath)?(scriptArgs)
    this.apiService.getInstance().webScript.executeWebScript(
      'POST',
      '/fr/jeci/send-mail/sendMail',
      params,
      'alfresco',
      'service'
    );

    // Fermer la popup
    this.dialogRef.close();
  }
}
