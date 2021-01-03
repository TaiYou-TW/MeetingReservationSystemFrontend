import * as config from './config';
import React from 'react';

class Reservation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            date: new Date().toISOString().slice(0, 10),
            rooms: null,
            reservations: null,
            isLoading: false,
            isChanged: false
        };

        this.startTimeHour = 9;
        this.handleChange = this.handleChange.bind(this);
        this.showReservation = this.showReservation.bind(this);
        this.showNewReservation = this.showNewReservation.bind(this);
    }

    getRoomList() {
        fetch(`${config.SERVER_URL}/room/`, { method: "GET" })
            .then(res => res.json())
            .then(res => {
                this.setState({
                    rooms: res.rooms
                });
            })
            .catch(e => {
                console.log(e);
            });
    }

    getReservationOfDate() {
        if (this.state.isLoading)
            return;

        let date = this.state.date;

        fetch(`${config.SERVER_URL}/reservation/?date=${date}`, {
            method: "GET",
        })
            .then(res => res.json())
            .then(res => {
                this.setState({
                    reservations: res.reservations,
                    isLoading: false,
                    isChanged: false
                });
            })
            .catch(e => {
                console.log(e);
            });
        this.setState({
            isLoading: true
        });
    }

    generateRoomList() {
        let room = this.state.rooms;
        let roomList = [];
        for (let i of room) {
            if (i.is_available) {
                roomList.push(<th key={i._id} className="align-middle" scope="col"> {i.name} </th>)
            }
        }
        return roomList;
    }

    generateTimeList() {
        let timeList = [];
        for (let i = 0; i < 14; i++) {
            let status = [];
            for (let j = 0; j < this.state.rooms.length; j++) {
                let find = false;
                if (this.state.reservations) {
                    this.state.reservations.forEach((ele, idx) => {
                        const start = new Date(ele.start);
                        const end = new Date(ele.end);
                        if (start.getHours() <= (i + this.startTimeHour) && end.getHours() <= (i + this.startTimeHour + 1) && ele.room_id === this.state.rooms[j]._id) {
                            status.push(<td key={`${i}-${j}`} className="table-active">
                                <button className="btn btn-link" data-toggle="modal" data-target="#reservationDetail" data-reservation={idx} onClick={this.showReservation}>{ele.topic}</button>
                            </td>);
                            find = true;
                            return;
                        }
                    });
                }
                if (!find) {
                    status.push(<td key={`${i}-${j}`}>
                        <button className="btn btn-outline-success" data-toggle="modal" data-target="#newReservation" onClick={this.showNewReservation} data-room={`${i}-${j}`}>預約</button>
                    </td>);
                }
            }

            timeList.push(<tr key={i} className="align-middle">
                <th scope="row"> {(i + this.startTimeHour).toString().padStart(2, '0') + ":00"} </th>
                {status}
            </tr>);
        }
        return timeList;
    }

    getRoomName(id) {
        for (let ele of this.state.rooms) {
            if (ele._id === id) {
                return ele.name;
            }
        }
    }

    showReservation(event) {
        const idx = parseInt(event.target.dataset.reservation);
        const reservation = this.state.reservations[idx];

        const spans = document.querySelectorAll('#reservationDetail > div > div > div:nth-child(2) > div span');
        spans[0].innerHTML = reservation.host_id;
        spans[1].innerHTML = this.getRoomName(reservation.room_id);
        spans[2].innerHTML = reservation.detail;
        spans[3].innerHTML = `${reservation.start.slice(0, 19)} ~ ${reservation.end.slice(0, 19)}`;

        const header = document.querySelector('#reservationDetail > div > div > div:nth-child(1) > h5 > span')
        header.innerHTML = reservation.topic;
    }

    showNewReservation(event) {
        const idx = event.target.dataset.room.split('-');
        const time = this.startTimeHour + parseInt(idx[0]);
        const room = this.state.rooms[idx[1]];

        this.generateTimeOption(idx);

        document.querySelector('#start').value = `${document.querySelector('#date').value} ${time}:00`;
        document.querySelector('#room').value = room.name;
    }

    generateTimeOption(idx) {
        const maxTime = this.getMaxTime(idx);

        document.querySelector('#time').innerHTML = "";
        for (let i = 1; i <= maxTime; i++) {
            let newOption = document.createElement("option");
            newOption.value = i;
            newOption.innerHTML = `${i} 小時`;
            document.querySelector('#time').appendChild(newOption);
        }
    }

    getMaxTime(idx) {
        let counter = 1;
        for (let i = 1; i <= 2; i++) {
            const nextTime = document.querySelector(`[data-room="${parseInt(idx[0]) + i}-${idx[1]}"]`);
            if (nextTime) {
                counter++;
            }
        }
        return counter;
    }

    handleChange(event) {
        this.setState({ date: event.target.value, isChanged: true })
    }

    showLoading() {
        return (<div className="d-flex p-5">
            <div className="d-flex w-100 justify-content-center align-self-center">
                <h1>Loading...</h1>
            </div>
        </div>);
    }

    render() {
        if ((!this.state.rooms || this.state.rooms.length === 0)) {
            this.getRoomList();
            return this.showLoading();
        }
        // if (this.state.isLoading) {
        //     return this.showLoading();
        // }
        if (this.state.isChanged) {
            this.getReservationOfDate();
        }

        const room = this.generateRoomList();
        const time = this.generateTimeList();

        return (
            <div className="container p-4">
                <input className="col-auto my-3 form-control" id="date" type="date" defaultValue={this.state.date} onChange={this.handleChange} />
                <div className="table-responsive">
                    <table className="table my-2 text-center">
                        <thead>
                            <tr>
                                <th className="align-middle" scope="col">#</th>
                                {room}
                            </tr>
                        </thead>
                        <tbody>
                            {time}
                        </tbody>
                    </table>
                </div>

                <div className="modal fade" id="newReservation" tabIndex="-1" aria-labelledby="reservationLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="reservationLabel">預約</h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <form>
                                    <div className="form-group">
                                        <label htmlFor="title">標題</label>
                                        <input type="text" className="form-control" id="title" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="detail">描述</label>
                                        <input type="text" className="form-control" id="detail" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="room">會議室</label>
                                        <input type="text" readOnly className="form-control" id="room" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="start">開始時間</label>
                                        <input type="text" readOnly className="form-control" id="start" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="time">持續時間</label>
                                        <select className="form-control" id="time">
                                            <option value="1">1 小時</option>
                                            <option value="2">2 小時</option>
                                            <option value="3">3 小時</option>
                                        </select>
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary">Submit</button>
                                <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal fade" id="reservationDetail" tabIndex="-1" aria-labelledby="reservationDetailLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="reservationDetailLabel">詳細資訊 - <span></span></h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group row">
                                    <label className="col-sm-3 col-form-label">主辦人：</label>
                                    <span className="col-sm-10 col-form-label"></span>
                                </div>
                                <div className="form-group row">
                                    <label className="col-sm-3 col-form-label">會議室：</label>
                                    <span className="col-sm-10 col-form-label"></span>
                                </div>
                                <div className="form-group row">
                                    <label className="col-sm-3 col-form-label">描述：</label>
                                    <span className="col-sm-10 col-form-label"></span>
                                </div>
                                <div className="form-group row">
                                    <label className="col-sm-3 col-form-label">時間：</label>
                                    <span className="col-sm-10 col-form-label"></span>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary">Join</button>
                                <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Reservation;