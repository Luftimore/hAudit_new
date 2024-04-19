use hdk::prelude::*;
use audit_integrity::*;
#[hdk_extern]
pub fn get_all_audits(_: ()) -> ExternResult<Vec<Link>> {
    let path = Path::from("all_audits");
    get_links(path.path_entry_hash()?, LinkTypes::AllAudits, None)
}

#[hdk_extern]
pub fn get_all_audits_content(_: ()) -> ExternResult<Vec<Record>> {
    let path = Path::from("all_audits");

    let links = get_links(path.path_entry_hash()?, LinkTypes::AllAudits, None)?;

    let mut results: Vec<Record> = Vec::new();

    for link in links {
        let action_hash = link.target.clone().into_action_hash().ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("No action hash associated with link"))
            ),
        )?;

        let maybe_record = get(action_hash, GetOptions::default())?;

        if let Some(record) = maybe_record {
            results.push(record);
        }
    }

    Ok(results)
}