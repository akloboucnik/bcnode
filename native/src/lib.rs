extern crate bcrust_core;

#[macro_use]
extern crate neon;

#[macro_use]
extern crate log;

extern crate env_logger;
extern crate protobuf;
extern crate rand;
extern crate bcrypt;

use bcrust_core::miner;
use bcrust_core::protos::miner::*;

use neon::vm::{Call, JsResult, Lock};
use neon::scope::{Scope};
use neon::js::{JsUndefined, JsFunction, JsBoolean, JsString};
use neon::js::binary::JsBuffer;
use neon::mem::Handle;
use neon::task::Task;
use rand::Rng;
use bcrypt::{DEFAULT_COST};

use std::time::{Instant};

use protobuf::core::parse_from_bytes;
use protobuf::Message;

struct MiningTask;

impl Task for MiningTask {
    type Output = String;
    type Error = String;
    type JsEvent = JsString;

    fn perform(&self) -> Result<Self::Output, Self::Error> {
        let start = Instant::now();
        let mut hashed;
        loop {
            let rstr: String = rand::thread_rng()
                .gen_ascii_chars()
                .take(64)
                .collect();

            hashed = match bcrypt::hash(rstr.as_str(), DEFAULT_COST) {
                Ok(res) => res,
                Err(err) => "error".to_string()
            };

            if start.elapsed().as_secs() > 10 {
                break;
            }
        }
        Ok(hashed)
    }

    fn complete<'a, T: Scope<'a>>(self, scope: &'a mut T, result: Result<Self::Output, Self::Error>) -> JsResult<Self::JsEvent> {
        Ok(JsString::new(scope, result.unwrap().as_str()).unwrap())
    }
}

fn mine_async(call: Call) -> JsResult<JsUndefined> {
    let f = call.arguments.require(call.scope, 0)?.check::<JsFunction>()?;
    MiningTask.schedule(f);
    Ok(JsUndefined::new())
}

fn init_logger(call: Call) -> JsResult<JsBoolean> {
    let scope = call.scope;
    let res = match env_logger::init() {
        Ok(_) => true,
        _ => false
    };

    Ok(JsBoolean::new(scope, res))
}

fn hello(call: Call) -> JsResult<JsString> {
    let scope = call.scope;
    Ok(JsString::new(scope, "Hello from native world!").unwrap())
}

fn mine(call: Call) -> JsResult<JsBuffer> {
    debug!("mine()");

    // Deserialize input
    let mut buffer: Handle<JsBuffer> = call.arguments.require(call.scope, 0)?.check::<JsBuffer>()?;
    let in_block = buffer.grab(|contents| {
        let slice = contents.as_slice();
        parse_from_bytes::<MinerRequest>(&slice)
    }).unwrap();

    let out_block: MinerResponse = miner::mine(&in_block);
    debug!("{:?}", &out_block);

    // Serialize output
    let serialized = out_block.write_to_bytes().unwrap();
    let scope = call.scope;
    let mut buffer = try!(JsBuffer::new(scope, serialized.len() as u32));
    buffer.grab(|mut contents| {
        let slice = contents.as_mut_slice();
        for i in 0..slice.len() {
            slice[i] = serialized[i] as u8;
        }
    });

    Ok(buffer)
}



register_module!(m, {
    m.export("hello", hello)?;
    m.export("initLogger", init_logger)?;
    m.export("mine", mine)?;
    m.export("mine_async", mine_async)?;

    Ok(())
});

