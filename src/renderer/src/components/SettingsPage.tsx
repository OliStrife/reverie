import { containingFolder, folderName, type Folders } from '../hooks/useFolders'
import { FolderIcon, OpenIcon, PlusIcon, TrashIcon } from './icons'
import PageToolbar from './PageToolbar'

type Props = {
  folders: Folders
  onBack: () => void
}

function SettingsPage({ folders, onBack }: Props): React.JSX.Element {
  const { list, covered } = folders

  return (
    <section className="page">
      <PageToolbar onBack={onBack} />
      <h1 className="page-title">Settings</h1>
      <div className="glass-card settings-section">
        <div className="section-head">
          <div>
            <h2>Music folders</h2>
            <p className="muted">Reverie shows songs from these folders, subfolders included.</p>
          </div>
          <button type="button" className="secondary-btn" onClick={folders.add}>
            <PlusIcon />
            Add folder
          </button>
        </div>

        {list && list.length === 0 && <p className="folder-empty muted">No folders added yet.</p>}

        {list && list.length > 0 && (
          <ul className="folder-list">
            {list.map((folder) => (
              <li key={folder} className="folder-row">
                <span className="folder-icon">
                  <FolderIcon />
                </span>
                <span className="folder-text">
                  <span className="folder-name">{folderName(folder)}</span>
                  <span className="folder-path">{folder}</span>
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  title="Show in Explorer"
                  onClick={() => folders.show(folder)}
                >
                  <OpenIcon />
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  title="Remove from library"
                  onClick={() => folders.remove(folder)}
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        )}

        {list &&
          covered.map((folder) => {
            const parent = containingFolder(folder, list)
            return (
              <p key={folder} className="notice">
                {folderName(folder)} is already in your library
                {parent ? `, it's inside ${folderName(parent)}.` : '.'}
              </p>
            )
          })}
      </div>
    </section>
  )
}

export default SettingsPage
