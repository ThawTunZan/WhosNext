// app/profile_screens/ContactUsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
  Image as RNImage,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  List,
  Card,
  Divider,
  SegmentedButtons,
  HelperText,
  IconButton,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme/theme';
import ProfileHeader from './ProfileHeader';
import { StatusBar } from 'expo-status-bar';

// FAQ data
const FAQs = [
  {
    question: "How do I split expenses?",
    answer: "You can easily split expenses by creating a new expense and selecting the members to split with. The app automatically calculates each person's share."
  },
  {
    question: "How do I create a new trip?",
    answer: "Tap the '+' button on the home screen and select 'New Trip'. Fill in the trip details and invite your friends to join."
  },
  {
    question: "How are debts calculated?",
    answer: "The app uses a smart algorithm to simplify debts between members, minimizing the number of transactions needed to settle up."
  },
  {
    question: "Can I edit an expense after adding it?",
    answer: "Yes, you can edit any expense by tapping on it and selecting the edit option. All members will be notified of the change."
  }
];

// Email templates for different categories
const EMAIL_TEMPLATES = {
  general: {
    subject: '[General Inquiry]',
    body: `Dear Who's Next Team,

I would like to inquire about the following:

{message}

Looking forward to your response.

Best regards,
{userName}`,
  },
  bug: {
    subject: '[Bug Report]',
    body: `Dear Who's Next Team,

I would like to report a bug:

Issue Description:
{message}

Device Information:
- Platform: {platform}
- App Version: {appVersion}

Steps to Reproduce:
1. {Please describe the steps}

Expected Behavior:
{What should happen}

Actual Behavior:
{What actually happened}

Screenshots attached (if any).

Best regards,
{userName}`,
  },
  feature: {
    subject: '[Feature Request]',
    body: `Dear Who's Next Team,

I would like to suggest a new feature:

Feature Description:
{message}

Use Case:
{Why this feature would be useful}

Thank you for considering my suggestion.

Best regards,
{userName}`,
  },
};

type ContactCategory = 'general' | 'bug' | 'feature';

const CATEGORY_LIMITS = {
  general: 500,
  bug: 1000,
  feature: 800
};

const FILE_LIMITS = {
  maxSize: 5 * 1024 * 1024, // 5MB in bytes
  maxFiles: 3,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/heic']
};

export default function ContactUsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<ContactCategory>('general');
  const [loading, setLoading] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);
  const [attachments, setAttachments] = useState<{ uri: string; name: string }[]>([]);
  const [messageError, setMessageError] = useState('');
  const [attachmentError, setAttachmentError] = useState('');

  const getCharacterLimit = () => CATEGORY_LIMITS[category];

  const validateFileSize = async (uri: string): Promise<boolean> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size <= FILE_LIMITS.maxSize;
    } catch (error) {
      console.error('Error checking file size:', error);
      return false;
    }
  };

  const pickImage = async () => {
    if (attachments.length >= FILE_LIMITS.maxFiles) {
      setAttachmentError(`Maximum ${FILE_LIMITS.maxFiles} images allowed`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: FILE_LIMITS.maxFiles - attachments.length,
    });

    if (!result.canceled) {
      setAttachmentError('');
      
      // Validate each selected image
      const validatedAttachments = await Promise.all(
        result.assets.map(async (asset) => {
          const isValidSize = await validateFileSize(asset.uri);
          if (!isValidSize) {
            setAttachmentError('Some images exceed 5MB size limit');
            return null;
          }
          return {
            uri: asset.uri,
            name: asset.uri.split('/').pop() || 'image.jpg',
            size: asset.fileSize || 0,
          };
        })
      );

      const validAttachments = validatedAttachments.filter(Boolean);
      setAttachments([...attachments, ...validAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleMessageChange = (text: string) => {
    const limit = getCharacterLimit();
    if (text.length <= limit) {
      setMessage(text);
      setMessageError('');
    } else {
      setMessageError(`Message exceeds ${limit} character limit`);
    }
  };

  const validateForm = () => {
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return false;
    }
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return false;
    }
    return true;
  };

  const uploadAttachments = async () => {
    const storage = getStorage();
    const uploadPromises = attachments.map(async (attachment) => {
      const response = await fetch(attachment.uri);
      const blob = await response.blob();
      const fileRef = ref(storage, `contact_attachments/${Date.now()}_${attachment.name}`);
      await uploadBytes(fileRef, blob);
      return getDownloadURL(fileRef);
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Upload attachments if any
      const attachmentUrls = attachments.length > 0 ? await uploadAttachments() : [];

      // Get email template
      const template = EMAIL_TEMPLATES[category];
      const emailBody = template.body
        .replace('{message}', message.trim())
        .replace('{userName}', user?.fullName || user?.username || 'User')
        .replace('{platform}', Platform.OS)
        .replace('{appVersion}', '1.0.0'); // Replace with actual version

      // Store in Firestore
      await addDoc(collection(db, 'contact_messages'), {
        username: user?.username,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        subject: subject.trim(),
        message: message.trim(),
        category,
        attachments: attachmentUrls,
        createdAt: serverTimestamp(),
        status: 'pending'
      });

      // Prepare email
      const emailSubject = encodeURIComponent(`${template.subject} ${subject.trim()}`);
      const emailContent = encodeURIComponent(emailBody);
      
      // Open email client
      Linking.openURL(`mailto:whosnextsplit.team@gmail.com?subject=${emailSubject}&body=${emailContent}`);

      Alert.alert(
        'Thank you!',
        'Your message has been sent. We\'ll get back to you soon.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openEmail = () => {
    Linking.openURL('mailto:whosnextsplit.team@gmail.com');
  };

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'bug', label: 'Report Bug' },
    { value: 'feature', label: 'Feature Request' },
  ];

  return (
    <>
      <StatusBar style={isDarkMode ? "dark" : "light"} />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <ProfileHeader title="Contact Us" subtitle="We're here to help! Send us a message."/>
          </View>
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* FAQ Section */}
      <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
      <Card.Title
          title="Frequently Asked Questions"
          titleStyle={{
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text,
          }}
        />
        <Card.Content>
          <List.AccordionGroup>
            {FAQs.map((faq, index) => (
              <List.Accordion
                key={index}
                title={faq.question}
                id={index.toString()}
                expanded={expandedFaq === index.toString()}
                onPress={() => setExpandedFaq(expandedFaq === index.toString() ? false : index.toString())}
                titleStyle={{
                  color: theme.colors.primary,
                  fontWeight: 'bold',
                }}
                descriptionStyle={{ color: theme.colors.subtext }}
                style={{ backgroundColor: theme.colors.surface }}
              >
                <List.Item 
                  title={faq.answer} 
                  titleNumberOfLines={0}
                  titleStyle={{
                    color: theme.colors.subtext,
                  }}
                  style={{ backgroundColor: theme.colors.surface }}
                />
              </List.Accordion>
            ))}
          </List.AccordionGroup>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {/* Contact Form Section */}
      <Card style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title="Send us a message"
          titleStyle={{
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text,
          }}
        />
        <Card.Content>
          <SegmentedButtons
            value={category}
            onValueChange={value => {
              setCategory(value as ContactCategory);
              // Clear message if it exceeds new category's limit
              if (message.length > CATEGORY_LIMITS[value as ContactCategory]) {
                setMessage('');
              }
            }}
            buttons={categories}
            style={styles.categoryButtons}
          />

          <TextInput
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            mode="outlined"
            style={styles.input}
            theme={{ colors: { primary: theme.colors.primary } }}
          />

          <TextInput
            label="Message"
            value={message}
            onChangeText={handleMessageChange}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            theme={{ colors: { primary: theme.colors.primary } }}
          />
          <HelperText type="info" visible={true}>
            {message.length}/{getCharacterLimit()} characters
          </HelperText>
          {messageError ? (
            <HelperText type="error" visible={true}>
              {messageError}
            </HelperText>
          ) : null}

          {/* Enhanced Attachments Section */}
          <View style={styles.attachmentsContainer}>
            <Button
              mode="outlined"
              onPress={pickImage}
              icon="image"
              style={styles.attachButton}
              disabled={attachments.length >= FILE_LIMITS.maxFiles}
            >
              Add Screenshots ({attachments.length}/{FILE_LIMITS.maxFiles})
            </Button>
            
            {attachmentError ? (
              <HelperText type="error" visible={true}>
                {attachmentError}
              </HelperText>
            ) : null}

            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((attachment, index) => (
                  <Card key={index} style={styles.attachmentCard}>
                    <Card.Cover
                      source={{ uri: attachment.uri }}
                      style={styles.attachmentImage}
                    />
                    <Card.Actions style={styles.attachmentActions}>
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => removeAttachment(index)}
                      />
                    </Card.Actions>
                  </Card>
                ))}
              </View>
            )}
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          >
            Send Message
          </Button>

          <Text style={[styles.orText, { color: theme.colors.subtext }]}>or</Text>

          <Button
            mode="outlined"
            onPress={openEmail}
            icon="email"
          >
            Email Us Directly
          </Button>
        </Card.Content>
      </Card>

      {/* Support Links */}
      <Card style={[styles.section, styles.lastSection, { backgroundColor: theme.colors.surface }]}>
        <Card.Title title="Other Ways to Reach Us" />
        <Card.Content>
          <List.Item
            title="Email Us"
            description="support@whosnext.com"
            left={props => <List.Icon {...props} icon="email" color={theme.colors.primary} />}
            titleStyle={{ color: theme.colors.text }}
            descriptionStyle={{ color: theme.colors.subtext }}
          />
          <Divider />
          <List.Item
            title="Call Us"
            description="1-800-WHOSNEXT"
            left={props => <List.Icon {...props} icon="phone" color={theme.colors.primary} />}
            titleStyle={{ color: theme.colors.text }}
            descriptionStyle={{ color: theme.colors.subtext }}
          />
          <Button
            mode="outlined"
            icon="twitter"
            onPress={() => Linking.openURL('https://twitter.com/whosnext')}
            style={[styles.socialButton, { marginTop: 8 }]}
            textColor={theme.colors.primary}
          >
            Twitter
          </Button>
          <Button
            mode="outlined"
            icon="instagram"
            onPress={() => Linking.openURL('https://instagram.com/whosnext')}
            style={[styles.socialButton, { marginTop: 8 }]}
            textColor={theme.colors.primary}
          >
            Instagram
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subtitle: {
    color: '#BDBDBD'
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  section: {
    margin: 16,
    elevation: 2,
  },
  lastSection: {
    marginBottom: 32,
  },
  divider: {
    marginVertical: 8,
  },
  input: {
    marginBottom: 16,
  },
  categoryButtons: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  attachmentsContainer: {
    marginBottom: 16,
  },
  attachButton: {
    marginBottom: 8,
  },
  attachmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  attachmentCard: {
    width: '48%',
    marginBottom: 8,
    elevation: 2,
  },
  attachmentImage: {
    height: 120,
    backgroundColor: '#f5f5f5',
  },
  attachmentActions: {
    justifyContent: 'flex-end',
    padding: 4,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  socialButton: {
    justifyContent: 'flex-start',
  },
}); 