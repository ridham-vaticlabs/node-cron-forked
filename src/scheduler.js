'use strict';

const EventEmitter = require('events');
const TimeMatcher = require('./time-matcher');

class Scheduler extends EventEmitter{
    constructor(pattern, timezone, autorecover){
        super();
        this.timeMatcher = new TimeMatcher(pattern, timezone);
        this.autorecover = autorecover;
    }

    start(){
        // clear timeout if exsits
        this.stop();
        const now_time = new Date();
        let lastCheck = now_time.getTime();
        let lastExecution = this.timeMatcher.apply(now_time);

        const matchTime = () => {
            const delay = 1000;
            const current_time = new Date().getTime();
            const missedExecutions = Math.floor(current_time/1000) - Math.floor(lastCheck/1000);
            
            for(let i = missedExecutions-1; i >= 0; i--){
                const date = new Date(current_time - i * 1000);
                let date_tmp = this.timeMatcher.apply(date);
                if(lastExecution.getTime() < date_tmp.getTime() && (i === 0 || this.autorecover) && this.timeMatcher.match(date)){
                    this.emit('scheduled-time-matched', date_tmp);
                    date_tmp.setMilliseconds(0);
                    lastExecution = date_tmp;
                }
            }
            lastCheck = current_time;
            this.timeout = setTimeout(matchTime, delay);
        };
        matchTime();
    }

    stop(){
        if(this.timeout){
            clearTimeout(this.timeout);
        }
        this.timeout = null;
    }
}

module.exports = Scheduler;