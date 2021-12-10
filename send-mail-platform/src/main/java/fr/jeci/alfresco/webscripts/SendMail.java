package fr.jeci.alfresco.webscripts;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import javax.activation.DataSource;
import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import javax.mail.util.ByteArrayDataSource;

import org.alfresco.model.ContentModel;
import org.alfresco.service.cmr.repository.ContentIOException;
import org.alfresco.service.cmr.repository.ContentReader;
import org.alfresco.service.cmr.repository.ContentService;
import org.alfresco.service.cmr.repository.MimetypeService;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.repository.StoreRef;
import org.alfresco.service.cmr.security.AuthenticationService;
import org.alfresco.service.cmr.security.PersonService;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.extensions.webscripts.Cache;
import org.springframework.extensions.webscripts.DeclarativeWebScript;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.WebScriptRequest;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

public class SendMail extends DeclarativeWebScript {

	private static Log logger = LogFactory.getLog(SendMail.class);

	private static final String PARAM_RECIPIENTS = "recipients";
	private static final String PARAM_RECIPIENTS_IN_COPY = "recipientsInCopy";
	private static final String PARAM_RECIPIENTS_IN_HIDDEN_COPY = "recipientsInHiddenCopy";
	private static final String PARAM_OBJECT = "object";
	private static final String PARAM_MESSAGE = "message";
	private static final String PARAM_NODEID = "nodeId";
	private static final String PARAM_IS_ATTACHMENT = "isAttachment";

	private JavaMailSender mailService;
	private NodeService nodeService;
	private AuthenticationService authenticationService;
	private PersonService personService;
	private ContentService contentService;
	private MimetypeService mimetypeService;
	private String headerEncoding;
	private String fromAddress;

	@Override
	protected Map<String, Object> executeImpl(WebScriptRequest req, Status status, Cache cache) {
		Map<String, Object> model = new HashMap<>();

		try {
			// Prepare message
			MimeMessageHelper email = prepareEmail(req);
			if (email != null) {
				if (logger.isDebugEnabled()) {
					logger.debug("Envoi du mail");
				}
				mailService.send(email.getMimeMessage());
			}
		} catch (Exception exception) {
			logger.error("Erreur lors de l'envoi du mail", exception);
		}
		return model;
	}

	/**
	 * Préparation du mail
	 * 
	 * @param req
	 * @return
	 * @throws MessagingException
	 */
	private MimeMessageHelper prepareEmail(WebScriptRequest req) throws MessagingException {

		boolean isAttachment = Boolean.parseBoolean(req.getParameter(PARAM_IS_ATTACHMENT));

		MimeMessage mimeMessage = mailService.createMimeMessage();
		MimeMessageHelper messageRef = new MimeMessageHelper(mimeMessage, isAttachment);
		try {
			// set header encoding if one has been supplied
			if (StringUtils.isNotBlank(headerEncoding)) {
				mimeMessage.setHeader("Content-Transfer-Encoding", headerEncoding);
			}

			// Set Recipients
			String to = req.getParameter(PARAM_RECIPIENTS);
			if (StringUtils.isNotBlank(to)) {
				messageRef.setTo(to.split(";"));
			}

			String cc = req.getParameter(PARAM_RECIPIENTS_IN_COPY);
			if (StringUtils.isNotBlank(cc)) {
				messageRef.setCc(cc.split(";"));
			}
			String bcc = req.getParameter(PARAM_RECIPIENTS_IN_HIDDEN_COPY);
			if (StringUtils.isNotBlank(bcc)) {
				messageRef.setBcc(bcc.split(";"));
			}

			// Set from sender
			if (StringUtils.isNotBlank(fromAddress)) {
				messageRef.setFrom(fromAddress);
			}

			// Set subject
			messageRef.setSubject(req.getParameter(PARAM_OBJECT));

			// Set message
			if (logger.isDebugEnabled()) {
				logger.debug("Param Text : " + req.getParameter(PARAM_MESSAGE));
			}
			String finMessage = "Ce mail a été généré depuis le serveur Pristy, copyright, disclaimer, Cordialement.";
			StringBuilder str = new StringBuilder();
			str.append(req.getParameter(PARAM_MESSAGE));
			str.append("\n");
			str.append(finMessage);
			str.append("\n");
			str.append("Pristy");
			messageRef.setText(str.toString(), false);
			

			// Set reply-to
			String currentUserName = authenticationService.getCurrentUserName();
			NodeRef fromPerson = personService.getPerson(currentUserName);
			String replyToActualUser = (String) nodeService.getProperty(fromPerson, ContentModel.PROP_EMAIL);
			if (StringUtils.isNotBlank(replyToActualUser) && replyToActualUser.length() != 0) {
				messageRef.setReplyTo(replyToActualUser);
			}

			if (isAttachment) {
				NodeRef document = new NodeRef(StoreRef.STORE_REF_WORKSPACE_SPACESSTORE, req.getParameter(PARAM_NODEID));
				addAttachment(document, messageRef);
			}

		} catch (Exception e) {
			// We're forced to catch java.lang.Exception here. Urgh.
			logger.error("Erreur lors de la préparation du mail", e);
			return null;
		}
		return messageRef;
	}

	private void addAttachment(NodeRef document, MimeMessageHelper message) throws MessagingException {
		if (logger.isDebugEnabled()) {
			logger.debug("Ajout de la pièce jointe au mail");
		}
		String fileName = nodeService.getProperty(document, ContentModel.PROP_NAME).toString();
		ContentReader reader = contentService.getReader(document, ContentModel.PROP_CONTENT);
		InputStream inputStream = reader.getContentInputStream();

		String mimetype = mimetypeService.getMimetype(FilenameUtils.getExtension(fileName));
		try {
			DataSource attachment = new ByteArrayDataSource(inputStream, mimetype);
			message.addAttachment(fileName, attachment);
		} catch (ContentIOException | MessagingException | IOException e) {
			logger.error("Erreur lors du rattachement de la pièce jointe", e);
			throw new MessagingException("Erreur lors du rattachement de la pièce jointe");
		}
	}

	// --------------------------------------------------------------------------- Getters / Setters

	/**
	 * @return the mailService
	 */
	public JavaMailSender getMailService() {
		return mailService;
	}

	/**
	 * @param mailService the mailService to set
	 */
	public void setMailService(JavaMailSender mailService) {
		this.mailService = mailService;
	}

	/**
	 * @return the nodeService
	 */
	public NodeService getNodeService() {
		return nodeService;
	}

	/**
	 * @param nodeService the nodeService to set
	 */
	public void setNodeService(NodeService nodeService) {
		this.nodeService = nodeService;
	}

	/**
	 * @return the authenticationService
	 */
	public AuthenticationService getAuthenticationService() {
		return authenticationService;
	}

	/**
	 * @param authenticationService the authenticationService to set
	 */
	public void setAuthenticationService(AuthenticationService authenticationService) {
		this.authenticationService = authenticationService;
	}

	/**
	 * @return the personService
	 */
	public PersonService getPersonService() {
		return personService;
	}

	/**
	 * @param personService the personService to set
	 */
	public void setPersonService(PersonService personService) {
		this.personService = personService;
	}

	/**
	 * @return the headerEncoding
	 */
	public String getHeaderEncoding() {
		return headerEncoding;
	}

	/**
	 * @param headerEncoding the headerEncoding to set
	 */
	public void setHeaderEncoding(String headerEncoding) {
		this.headerEncoding = headerEncoding;
	}

	/**
	 * @return the contentService
	 */
	public ContentService getContentService() {
		return contentService;
	}

	/**
	 * @param contentService the contentService to set
	 */
	public void setContentService(ContentService contentService) {
		this.contentService = contentService;
	}

	/**
	 * @return the mimetypeService
	 */
	public MimetypeService getMimetypeService() {
		return mimetypeService;
	}

	/**
	 * @param mimetypeService the mimetypeService to set
	 */
	public void setMimetypeService(MimetypeService mimetypeService) {
		this.mimetypeService = mimetypeService;
	}

	/**
	 * @return the fromAddress
	 */
	public String getFromAddress() {
		return fromAddress;
	}

	/**
	 * @param fromAddress the fromAddress to set
	 */
	public void setFromAddress(String fromAddress) {
		this.fromAddress = fromAddress;
	}
}
