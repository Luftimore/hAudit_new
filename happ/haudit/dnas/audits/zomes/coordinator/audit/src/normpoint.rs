use hdk::prelude::*;
use audit_integrity::*;
#[hdk_extern]
pub fn create_normpoint(normpoint: Normpoint) -> ExternResult<Record> {
    let normpoint_hash = create_entry(&EntryTypes::Normpoint(normpoint.clone()))?;
    create_link(
        normpoint.audit_hash.clone(),
        normpoint_hash.clone(),
        LinkTypes::AuditToNormpoints,
        (),
    )?;
    let record = get(normpoint_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Normpoint"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_latest_normpoint(
    original_normpoint_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let links = get_links(
        original_normpoint_hash.clone(),
        LinkTypes::NormpointUpdates,
        None,
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_a.timestamp.cmp(&link_b.timestamp));
    let latest_normpoint_hash = match latest_link {
        Some(link) => {
            link.target
                .clone()
                .into_action_hash()
                .ok_or(
                    wasm_error!(
                        WasmErrorInner::Guest(String::from("No action hash associated with link"))
                    ),
                )?
        }
        None => original_normpoint_hash.clone(),
    };
    get(latest_normpoint_hash, GetOptions::default())
}
#[hdk_extern]
pub fn get_original_normpoint(
    original_normpoint_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let Some(details) = get_details(original_normpoint_hash, GetOptions::default())?
    else {
        return Ok(None);
    };
    match details {
        Details::Record(details) => Ok(Some(details.record)),
        _ => {
            Err(
                wasm_error!(
                    WasmErrorInner::Guest(String::from("Malformed get details response"))
                ),
            )
        }
    }
}
#[hdk_extern]
pub fn get_all_revisions_for_normpoint(
    original_normpoint_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let Some(original_record) = get_original_normpoint(original_normpoint_hash.clone())?
    else {
        return Ok(vec![]);
    };
    let links = get_links(
        original_normpoint_hash.clone(),
        LinkTypes::NormpointUpdates,
        None,
    )?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| Ok(
            GetInput::new(
                link
                    .target
                    .into_action_hash()
                    .ok_or(
                        wasm_error!(
                            WasmErrorInner::Guest(String::from("No action hash associated with link"))
                        ),
                    )?
                    .into(),
                GetOptions::default(),
            ),
        ))
        .collect::<ExternResult<Vec<GetInput>>>()?;
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let mut records: Vec<Record> = records.into_iter().filter_map(|r| r).collect();
    records.insert(0, original_record);
    Ok(records)
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateNormpointInput {
    pub original_normpoint_hash: ActionHash,
    pub previous_normpoint_hash: ActionHash,
    pub updated_normpoint: Normpoint,
}
#[hdk_extern]
pub fn update_normpoint(input: UpdateNormpointInput) -> ExternResult<Record> {
    let updated_normpoint_hash = update_entry(
        input.previous_normpoint_hash.clone(),
        &input.updated_normpoint,
    )?;
    create_link(
        input.original_normpoint_hash.clone(),
        updated_normpoint_hash.clone(),
        LinkTypes::NormpointUpdates,
        (),
    )?;
    let record = get(updated_normpoint_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated Normpoint"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_normpoint(
    original_normpoint_hash: ActionHash,
) -> ExternResult<ActionHash> {
    let details = get_details(original_normpoint_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("{pascal_entry_def_name} not found"))
            ),
        )?;
    let record = match details {
        Details::Record(details) => Ok(details.record),
        _ => {
            Err(
                wasm_error!(
                    WasmErrorInner::Guest(String::from("Malformed get details response"))
                ),
            )
        }
    }?;
    let entry = record
        .entry()
        .as_option()
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Normpoint record has no entry"))
            ),
        )?;
    let normpoint = Normpoint::try_from(entry)?;
    let links = get_links(
        normpoint.audit_hash.clone(),
        LinkTypes::AuditToNormpoints,
        None,
    )?;
    for link in links {
        if let Some(action_hash) = link.target.into_action_hash() {
            if action_hash.eq(&original_normpoint_hash) {
                delete_link(link.create_link_hash)?;
            }
        }
    }
    delete_entry(original_normpoint_hash)
}
#[hdk_extern]
pub fn get_all_deletes_for_normpoint(
    original_normpoint_hash: ActionHash,
) -> ExternResult<Option<Vec<SignedActionHashed>>> {
    let Some(details) = get_details(original_normpoint_hash, GetOptions::default())?
    else {
        return Ok(None);
    };
    match details {
        Details::Entry(_) => {
            Err(wasm_error!(WasmErrorInner::Guest("Malformed details".into())))
        }
        Details::Record(record_details) => Ok(Some(record_details.deletes)),
    }
}
#[hdk_extern]
pub fn get_oldest_delete_for_normpoint(
    original_normpoint_hash: ActionHash,
) -> ExternResult<Option<SignedActionHashed>> {
    let Some(mut deletes) = get_all_deletes_for_normpoint(original_normpoint_hash)? else {
        return Ok(None);
    };
    deletes
        .sort_by(|delete_a, delete_b| {
            delete_a.action().timestamp().cmp(&delete_b.action().timestamp())
        });
    Ok(deletes.first().cloned())
}
#[hdk_extern]
pub fn get_normpoints_for_audit(audit_hash: ActionHash) -> ExternResult<Vec<Link>> {
    get_links(audit_hash, LinkTypes::AuditToNormpoints, None)
}
#[hdk_extern]
pub fn get_deleted_normpoints_for_audit(
    audit_hash: ActionHash,
) -> ExternResult<Vec<(SignedActionHashed, Vec<SignedActionHashed>)>> {
    let details = get_link_details(audit_hash, LinkTypes::AuditToNormpoints, None)?;
    Ok(
        details
            .into_inner()
            .into_iter()
            .filter(|(_link, deletes)| deletes.len() > 0)
            .collect(),
    )
}
