/**
 *
 */
package fr.jeci.alfresco.repo.node.policy;

import java.io.Serializable;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;

import org.alfresco.model.ContentModel;
import org.alfresco.model.ImapModel;
import org.alfresco.repo.content.MimetypeMap;
import org.alfresco.repo.node.NodeServicePolicies.OnAddAspectPolicy;
import org.alfresco.repo.policy.Behaviour;
import org.alfresco.repo.policy.JavaBehaviour;
import org.alfresco.repo.policy.PolicyComponent;
import org.alfresco.service.cmr.dictionary.InvalidTypeException;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.ContentIOException;
import org.alfresco.service.cmr.repository.ContentReader;
import org.alfresco.service.cmr.repository.ContentService;
import org.alfresco.service.cmr.repository.ContentWriter;
import org.alfresco.service.cmr.repository.InvalidNodeRefException;
import org.alfresco.service.cmr.repository.MimetypeService;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.namespace.NamespaceService;
import org.alfresco.service.namespace.QName;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.simplejavamail.api.email.AttachmentResource;
import org.simplejavamail.converter.EmailConverter;

/**
 * @author cindy
 *
 */
public class CreateAttachmentEML implements OnAddAspectPolicy {
  private Log logger = LogFactory.getLog(getClass());

  private NodeService nodeService;
  private PolicyComponent policyComponent;
  private ContentService contentService;
  private MimetypeService mimetypeService;

  public void registerEventHandlers() {
    // Bind behaviours to node policies
    this.policyComponent.bindClassBehaviour(QName.createQName(NamespaceService.ALFRESCO_URI, "onAddAspect"),
        ImapModel.ASPECT_IMAP_CONTENT,
        new JavaBehaviour(this, "onAddAspect", Behaviour.NotificationFrequency.TRANSACTION_COMMIT));
  }

  @Override
  public void onAddAspect(NodeRef currentDocument, QName aspectTypeQName) {
    // Test si le noeud est de type EML
    ChildAssociationRef parent = nodeService.getPrimaryParent(currentDocument);
    NodeRef currentFolder = parent.getParentRef();
    if (nodeService.exists(currentDocument) && nodeService.exists(currentFolder)) {
      String currentFilename = nodeService.getProperty(currentDocument, ContentModel.PROP_NAME).toString();
      String currentMimetype = mimetypeService.getMimetype(FilenameUtils.getExtension(currentFilename));
      if (MimetypeMap.MIMETYPE_RFC822.contentEquals(currentMimetype)) {
        if (logger.isDebugEnabled()) {
          logger.debug("Le fichier est de type EML - Start Extraction des pièces jointes");
        }

        // Récupérer les pièces jointes
        ContentReader reader = contentService.getReader(currentDocument, ContentModel.PROP_CONTENT);
        try {
          MimeMessage message = new MimeMessage(null, reader.getContentInputStream());
          List<AttachmentResource> attachments = EmailConverter.mimeMessageToEmail(message).getAttachments();
          if (logger.isDebugEnabled()) {
            logger.debug("Nombre de pièces jointes : " + attachments.size());
          }
          if (CollectionUtils.isNotEmpty(attachments)) {
            // Création du dossier qui contiendra les pièces jointes
            String attachmentFolderName = FilenameUtils.removeExtension(currentFilename);
            Map<QName, Serializable> propsFolder = new HashMap<QName, Serializable>();
            propsFolder.put(ContentModel.PROP_NAME, attachmentFolderName);
            NodeRef attachmentFolder = nodeService.createNode(currentFolder, ContentModel.ASSOC_CONTAINS,
                QName.createQName(NamespaceService.CONTENT_MODEL_1_0_URI, attachmentFolderName),
                ContentModel.TYPE_FOLDER, propsFolder).getChildRef();
            nodeService.createAssociation(currentDocument, attachmentFolder, ImapModel.ASSOC_IMAP_ATTACHMENTS_FOLDER);
            // Ajout des pièces jointes dans ce dossier
            for (AttachmentResource attachment : attachments) {
              // Extraire les pièces jointes dans alfresco
              NodeRef attachmentNode = createFileAttachment(attachment, attachmentFolder);
              // Lier les pièces jointes au fichier eml
              if (nodeService.exists(attachmentNode)) {
                nodeService.createAssociation(currentDocument, attachmentNode, ImapModel.ASSOC_IMAP_ATTACHMENT);
              }

            }
          }
        } catch (InvalidNodeRefException | InvalidTypeException e) {
          logger.error("Erreur lors de la création du dossier des pièces jointes", e);
        } catch (ContentIOException e) {
          logger.error("Erreur lors de la lecture du contenu du mail", e);
        } catch (MessagingException e) {
          logger.error("Erreur lors de la récupération du mail", e);
        }
      }
    }

  }

  private NodeRef createFileAttachment(AttachmentResource attachment, NodeRef folder) {
    // Create a map to contain the values of the properties of the node
    String name = attachment.getDataSource().getName();
    Map<QName, Serializable> props = new HashMap<QName, Serializable>();
    props.put(ContentModel.PROP_NAME, name);

    NodeRef node = null;
    try {
      // use the node service to create a new node
      node = nodeService
          .createNode(folder, ContentModel.ASSOC_CONTAINS,
              QName.createQName(NamespaceService.CONTENT_MODEL_1_0_URI, name), ContentModel.TYPE_CONTENT, props)
          .getChildRef();
      // Use the content service to set the content onto the newly created node
      ContentWriter writer = contentService.getWriter(node, ContentModel.PROP_CONTENT, true);
      writer.setMimetype(mimetypeService.guessMimetype(name));
      writer.setEncoding("UTF-8");
      writer.putContent(attachment.getDataSourceInputStream());
    } catch (InvalidNodeRefException | InvalidTypeException e) {
      logger.error("Erreur lors de la création de la pièce jointe : " + name, e);
    }

    return node;
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
   * @return the policyComponent
   */
  public PolicyComponent getPolicyComponent() {
    return policyComponent;
  }

  /**
   * @param policyComponent the policyComponent to set
   */
  public void setPolicyComponent(PolicyComponent policyComponent) {
    this.policyComponent = policyComponent;
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

}
