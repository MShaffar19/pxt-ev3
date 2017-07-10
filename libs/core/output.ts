enum Output {
    A = 0x01,
    B = 0x02,
    C = 0x04,
    D = 0x08,
    ALL = 0x0f
}

enum OutputType {
    None = 0,
    Tacho = 7,
    MiniTacho = 8,
}

namespace output {
    //% shim=output::writePWM
    function writePWM(buf: Buffer): void { }

    function mkCmd(out: Output, cmd: number, addSize: number) {
        let b = createBuffer(2 + addSize)
        b.setNumber(NumberFormat.UInt8LE, 0, cmd)
        b.setNumber(NumberFormat.UInt8LE, 1, out)
        return b
    }

    export function stop(out: Output, useBreak = false) {
        let b = mkCmd(out, LMS.opOutputStop, 1)
        b.setNumber(NumberFormat.UInt8LE, 2, useBreak ? 1 : 0)
        writePWM(b)
    }

    export function start(out: Output) {
        let b = mkCmd(out, LMS.opOutputStart, 0)
        writePWM(b)
    }

    export function reset(out: Output) {
        let b = mkCmd(out, LMS.opOutputReset, 0)
        writePWM(b)
    }

    export function setSpeed(out: Output, speed: number) {
        let b = mkCmd(out, LMS.opOutputSpeed, 1)
        b.setNumber(NumberFormat.Int8LE, 2, Math.clamp(-100, 100, speed))
        writePWM(b)
    }

    export function setPower(out: Output, power: number) {
        let b = mkCmd(out, LMS.opOutputPower, 1)
        b.setNumber(NumberFormat.Int8LE, 2, Math.clamp(-100, 100, power))
        writePWM(b)
    }

    export function setPolarity(out: Output, polarity: number) {
        let b = mkCmd(out, LMS.opOutputPolarity, 1)
        b.setNumber(NumberFormat.Int8LE, 2, Math.clamp(-1, 1, polarity))
        writePWM(b)
    }

    export interface StepOptions {
        power?: number;
        speed?: number; // either speed or power has to be present
        step1: number;
        step2: number;
        step3: number;
        useSteps?: boolean; // otherwise use milliseconds
        useBreak?: boolean;
    }

    export function step(out: Output, opts: StepOptions) {
        let op = opts.useSteps ? LMS.opOutputStepSpeed : LMS.opOutputTimeSpeed
        let speed = opts.speed
        if (speed == null) {
            speed = opts.power
            op = opts.useSteps ? LMS.opOutputStepPower : LMS.opOutputTimePower
            if (speed == null)
                return
        }
        speed = Math.clamp(-100, 100, speed)

        let b = mkCmd(out, op, 15)
        b.setNumber(NumberFormat.Int8LE, 2, speed)
        // note that b[3] is padding
        b.setNumber(NumberFormat.Int32LE, 4 + 4 * 0, opts.step1)
        b.setNumber(NumberFormat.Int32LE, 4 + 4 * 1, opts.step2)
        b.setNumber(NumberFormat.Int32LE, 4 + 4 * 2, opts.step3)
        b.setNumber(NumberFormat.Int8LE, 4 + 4 * 3, opts.useBreak ? 1 : 0)
        writePWM(b)
    }

    const types = [0, 0, 0, 0]
    export function setType(out: Output, type: OutputType) {
        let b = mkCmd(out, LMS.opOutputSetType, 3)
        for (let i = 0; i < 4; ++i) {
            if (out & (1 << i)) {
                types[i] = type
            }
            b.setNumber(NumberFormat.UInt8LE, i + 1, types[i])
        }
        writePWM(b)
    }
}


interface Buffer {
    [index: number]: number;
    // rest defined in buffer.cpp
}