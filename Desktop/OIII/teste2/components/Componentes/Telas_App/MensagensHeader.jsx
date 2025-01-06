// import libraries
import { Icon } from 'native-base';
import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Avatar } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../Chat/Color';
import { FONTS } from '../Chat/Font';

// create a component
const ChatHeader = (props) => {
    const { data } = props;
    const navigation = useNavigation(); // Use directly here
    const [lastSeen, setLastSeen] = useState('')

    if (!data) {
        return null; // Handle the case where `data` is undefined or null
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.theme} translucent={false} />
            <Icon
                style={{
                    marginHorizontal: 10,
                    color: COLORS.white,
                }}
                name="chevron-back"
                type="Ionicons"
                onPress={() => navigation.goBack()} // Use goBack() for navigation
            />
            <Avatar
                source={{ uri: data.img }} 
                rounded
                size="small"
            /> 
            <View style={{ flex: 1, marginLeft: 10 }}>
                <Text
                    numberOfLines={1}
                    style={{
                        color: COLORS.white,
                        fontSize: 16,
                        fontFamily: FONTS.SemiBold,
                        textTransform: 'capitalize'
                    }}
                >
                    {data.name || 'Unknown Name'} {/* Provide a default value */}
                </Text>

                {/* Uncomment if you need to display lastSeen */}
                {/* <Text
                    style={{ color: COLORS.primaryBackground, fontSize: 10, fontFamily: FONTS.Regular }}
                >
                    {lastSeen}
                </Text> */}
            </View>

            {/* Uncomment if you need this icon */}
            {/* <Icon
                style={{
                    marginHorizontal: 10,
                    color: COLORS.themeColor
                }}
                name="videocam-outline"
                type="Ionicons"
            /> */}
        </View>
    );
};

// define your styles
const styles = StyleSheet.create({
    container: {
        height: 70,
        backgroundColor: COLORS.theme,
        elevation: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
});

// make this component available to the app
export default ChatHeader;
