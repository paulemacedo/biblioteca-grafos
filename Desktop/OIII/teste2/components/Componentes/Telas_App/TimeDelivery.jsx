//import liraries
import moment from 'moment';
import { Icon } from 'native-base';
import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../Chat/Color';

// create a component
const TimeDelivery = (props) => {
    const { sender, item } = props;

    // Verifique se item está definido e tem a propriedade send_time
    const sendTime = item && item.send_time ? item.send_time : 'Data não disponível';

    return (
        <View style={[styles.mainView, { justifyContent: 'flex-end' }]}>
            <Text style={{
                fontFamily: 'Poppins-Regular', 
                fontSize: 7,
                color: sender ? COLORS.white : COLORS.black
            }}>
                {moment(sendTime).format('LLL')}
            </Text>
            <Icon
                name="checkmark-done"
                type="Ionicons"
                style={{ color: item && item.seen ? COLORS.black : COLORS.white, fontSize: 15, marginLeft: 5 }}
            />
        </View>
    );
};


// define your styles
const styles = StyleSheet.create({
    mainView: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2
    }
});

//make this component available to the app
export default TimeDelivery;