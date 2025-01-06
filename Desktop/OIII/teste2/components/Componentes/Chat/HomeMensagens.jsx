import { Icon } from 'native-base';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-elements';
import { COLORS } from './Color';
import { FONTS } from './Font';

// Suponha que você passe `userData` como uma propriedade do componente
const HomeMensagens = ({ userData }) => {
    
    return (
        <View style={styles.container}>
            <Text style={styles.logo}>DEVELOPERS' SIN</Text>
            <View style={styles.rightSection}>
                <Icon 
                    name="notifications"
                    type="Ionicons"   
                    style={styles.icon}
                />
                <Avatar 
                    source={{ uri: userData.img }} 
                    rounded
                    size="small" 
                />
            </View>
        </View>
    );
};

export default HomeMensagens;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        paddingHorizontal: 15,
        backgroundColor: COLORS.white,
        elevation: 2,
        paddingVertical: 15
    },
    logo: {
        fontFamily: FONTS.Bold,
        color: COLORS.theme,
        fontSize: 22,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        color: COLORS.theme,
        marginRight: 7
    }
});
