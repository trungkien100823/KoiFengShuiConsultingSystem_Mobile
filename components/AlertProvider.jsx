import React, { createContext, useContext, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [buttons, setButtons] = useState([]);

  const showAlert = (title, message, buttons = [{ text: 'OK' }]) => {
    setTitle(title);
    setMessage(message);
    setButtons(buttons.map(button => ({
      ...button,
      onPress: () => {
        setVisible(false);
        if (button.onPress) setTimeout(button.onPress, 0);
      }
    })));
    setVisible(true);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        transparent={true}
        visible={visible}
        animationType="fade"
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'destructive' && styles.destructiveButton,
                    button.style === 'cancel' && styles.cancelButton
                  ]}
                  onPress={button.onPress}
                >
                  <Text 
                    style={[
                      styles.buttonText,
                      button.style === 'cancel' && styles.cancelText,
                      button.style === 'destructive' && styles.destructiveText
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  destructiveButton: {
    backgroundColor: '#ffebee',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#333',
  },
  destructiveText: {
    color: '#d9534f',
  },
  cancelText: {
    color: '#666',
  },
});
